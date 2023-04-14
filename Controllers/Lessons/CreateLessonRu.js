const joi = require('joi')
const Lesson = require('../../DB/models/Lesson')
const Level = require('../../DB/models/Level')
const {S3, PutObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3')
const { StatusCodes } = require('http-status-codes')
const fs = require('fs')
const path = require('path')
const {deleteLocalFiles} = require('./CreateLessonEng')
const {CloudFrontClient, CreateInvalidationCommand} = require('@aws-sdk/client-cloudfront')
const { BadRequest } = require('../../Error/ErrorSamples')
const mongoose = require('mongoose')
const genKey = require('../../helperFuncs/genS3Key')

const uploadsFolderPath = path.join(__dirname, '..', '..', 'uploads')
const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: process.env.AWS_REGION
})
const CloudFront = new CloudFrontClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: process.env.AWS_REGION
})


async function deleteFromS3(key){
    try{
        const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        })
        const response = await s3.send(deleteCommand)
        return response
    }catch(err){
        console.log(err)
        throw err
    }
}
async function invalidateCash(key){
    try{
        const invlidationCommand = new CreateInvalidationCommand({
            DistributionId: process.env.AWS_CLOUD_DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: key,
                Paths: {
                    Quantity: 1,
                    Items: [`/${key}`]
                }
            }
        })
        const response = await CloudFront.send(invlidationCommand)
        return response 
    }catch(err){
        console.log(err)
        throw err
    }
}
async function deleteCloudFiles(key){
    try{
        const res_s3 = await deleteFromS3(key)
        const res_cloud = await invalidateCash(key)
        console.log(res_s3)
        console.log(res_cloud)
        return true 
    }catch(err){
        console.log(err)
        throw err 
    }
}

async function verifyInputs(req, folderPath){
    const levelRange = ['beginner', 'elementary', 'pre-intermediate', 'intermediate','upper-intermediate', 'ielts']
    const jsondataValidation = joi.object({
        level: joi.string().valid(...levelRange).insensitive(),
        title: joi.string().min(4).max(30),
        description: joi.string().min(5)
    })
    function isImage(filename){
        const imageFormats = ['.jpeg', '.jpg', '.png']
        const extension = filename.substr(filename.lastIndexOf('.')).toLowerCase()
        return imageFormats.includes(extension)
    }
    function isVideo(filename){
        const videoFormats = ['.mov', '.mp4', '.avi']
        const extension = filename.substr(filename.lastIndexOf('.')).toLowerCase()
        return videoFormats.includes(extension)
    }
    try{
        const {jsondata} = req.body
        if(!jsondata) throw BadRequest("Provide all of the essential information regarding the lesson")
        const parsedJson = await JSON.parse(jsondata)
        const {error, value} = jsondataValidation.validate(parsedJson)
        if(error) throw error
        let videoNumber = 0; 
        let imageNumber = 0; 
        const uppercaseLevel = value.level.toUpperCase()
        value.level = uppercaseLevel 
        const files = await new Promise((resolve, reject) =>{
            fs.readdir(folderPath, (err,files) =>{
                if(err){
                    console.log(err)
                    reject(err)
                }
                files.forEach(item => {
                    if(isImage(item)){
                        imageNumber += 1 
                    }else if(isVideo(item)){
                        videoNumber += 1 
                    }
                })
                if(videoNumber !== 2 || imageNumber > 1){
                    if(videoNumber > 2){
                        reject(new BadRequest(`Only two videos are allowed, ${videoNumber} videos were provided`))
                    }else if(imageNumber > 1){
                        reject(new BadRequest(`Only one image is allowed. ${imageNumber} are uploaded`))
                    }else if(videoNumber < 2){
                        reject(new BadRequest(`Two videos are required, ${videoNumber} was provided`))
                    }
                }
                resolve(files)
            })
        })
        return {json: value, fileNames: files}
    }catch(err){
        throw err
    }
}

async function uploadToS3(file){
    console.log('Im on it....')
    try{
        const readStream = fs.createReadStream(path.join(uploadsFolderPath, file.originalname))
        readStream.on('error', (err) => {
            console.log(err)
            throw err 
        })
        const putCommand = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.awsKey,
            ContentType: file.mimetype,
            ContentDisposition: 'inline',
            Body: readStream
        })
        const response = await s3.send(putCommand)
        return response 
    }catch(err){
        console.log(err)
        throw err 
    }
}
const createLessonRuz = async(req, res, next) =>{
    const session = await mongoose.startSession()
    session.startTransaction()
    let abortTransaction = false
    const modifiedFiles = [] 
    try{
        const {json} = await verifyInputs(req, uploadsFolderPath)
        const files = req.files 
        for(const item in files){
            if(files[item][0]){
                const temp = files[item][0]
                const newFileName = temp.filename.replace(/[\s-]+/g, '') 
                modifiedFiles.push({
                    fieldname: temp.fieldname,
                    filename: newFileName,
                    mimetype: temp.mimetype,
                    originalname: temp.originalname,
                    awsKey: genKey() + newFileName
                })
            }
        }

        const lesson = new Lesson(json)
        for(const item of modifiedFiles){
            console.log('Item', item)
            if(item.fieldname === 'videoRu'){
                lesson.videos.russian = item.awsKey
            }else if(item.fieldname === 'videoUz'){
                lesson.videos.uzbek = item.awsKey
            }else if(item.fieldname === 'image'){
                lesson.thumbNail = item.awsKey
            }
            const response = await uploadToS3(item)
            console.log(response)
        }
        await lesson.save({session})
        const level = await Level.findOneAndUpdate({level: json.level}, { // error done on purpose 
            $push: {lessons: lesson._id}
        }, {new: true, session})
        if(!level){
            abortTransaction = true 
            throw new BadRequest("Failed to create the lesson")
        }
        await session.commitTransaction()
        return res.status(StatusCodes.CREATED).json({msg: 'Lesson has been uploaded', lesson})
    }catch(err){
        abortTransaction = true
        for(const item of modifiedFiles){
            await deleteCloudFiles(item.awsKey)
        }            
        console.log(err)
        return next(err)
    }finally{
        if(abortTransaction){
            await session.abortTransaction()
        }
        await deleteLocalFiles(uploadsFolderPath)
        await session.endSession()
    }
}

module.exports = createLessonRuz