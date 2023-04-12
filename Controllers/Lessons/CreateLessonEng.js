const {S3, PutObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3')
const  {CloudFrontClient, CreateInvalidationCommand} = require('@aws-sdk/client-cloudfront')
const { StatusCodes } = require('http-status-codes')
const fs = require('fs')
const joi = require('joi')
const genKey = require('../../helperFuncs/genS3Key')
const mongoose = require('mongoose')
const Lesson = require('../../DB/models/Lesson')
const Level = require('../../DB/models/Level')
const path = require('path')
const {BadRequest} = require('../../Error/ErrorSamples')
const BUCKET_NAME = process.env.AWS_BUCKET_NAME     
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


const CreateLessonInEnglish = async(req, res, next) =>{
    const uploadsFolder = path.join(__dirname, '..', '..', 'uploads')
    let Aws_Video_Key = ''
    let Aws_Image_Key = ''
    const session = await mongoose.startSession()
    session.startTransaction()
    let abortTransaction = false 
    try{
        const result = await verifyInputs(req)
        const {video, image, jsondata: {title, description, level}} = result 
        Aws_Video_Key = await uploadVideoToS3(uploadsFolder, video)
        if(image){
            Aws_Image_Key = await uploadImageToS3(uploadsFolder, image)
        }
        const queryLevel = level.toUpperCase()
        const lesson = new Lesson({
            thumbNail: Aws_Image_Key,
            title: title,
            description,
            videos: {
                english: Aws_Video_Key
            },
            level: queryLevel
        }) 
        const uploadedLesson = await lesson.save({session})
        if(!uploadedLesson){
            throw new mongoose.Error('mongo error')
        }
        const course = await Level.findOneAndUpdate({level: queryLevel}, {$push: {lessons: lesson._id}}, {session}) 
        if(!course){
            throw new mongoose.Error("mongo error")
        }
        const transaction = await session.commitTransaction()
        return res.status(StatusCodes.CREATED).json({msg: 'Lesson has been created successfuly', status: "oki ;)"}) 
    }catch(err){ 
        if(Aws_Video_Key){
            await deleteFromS3(Aws_Video_Key) // deletes files from s3 and invalidates cash in CDN
        }
        if(Aws_Image_Key){
            await deleteFromS3(Aws_Image_Key) // deletes files from s3 and invalidates cash in CDN
        }
        abortTransaction = true 
        await deleteLocalFiles(uploadsFolder)
        return next(err)
    }finally{
        if(abortTransaction){
            await session.abortTransaction()
        }
        await deleteLocalFiles(uploadsFolder) // delete all files from local folder 
        await session.endSession()
    }
}

async function verifyInputs(req){
    const result = {video: '', image: ''}
    const levelRange = ['beginner', 'elementary', 'pre-intermediate', 'intermediate','upper-intermediate', 'ielts']
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
    const uploadsFolder = path.join(__dirname, '..', '..', 'uploads')
    try{
        if(!req.body.jsondata) throw new Error('provide all credentials')
        const jsondata = await JSON.parse(req.body.jsondata)
        const joiSchema = joi.object({
            level: joi.string().valid(...levelRange).insensitive(),
            title: joi.string().min(4).max(20),
            description: joi.string().min(5)
        })
        const {error, value} = joiSchema.validate(jsondata)
        if(error){
            console.log(error)
            throw error
        }
        const files = await new Promise((resolve, reject) => {
            let isImagePresent = false 
            let isVideoPresent = false 
            fs.readdir(uploadsFolder, function (err, files) {
              if(err){
                reject(err); // pass the error to the callback function
              }
              files.forEach(item => {
                  if(isVideo(item)){
                      isVideoPresent = true 
                      result.video = item 
                    }else if(isImage(item)){
                        isImagePresent = true
                        result.image = item  
                    }
                })
                if(isVideoPresent === false){
                    reject(new BadRequest('Video must be provided'))
                }
              resolve(files); // pass the result to the callback function
            });
        });
        result.jsondata = value 
        return result 
    }catch(err){
        console.log('uploads folder', uploadsFolder)
        await deleteLocalFiles(uploadsFolder)
        throw err
    }
}
function deleteLocalFiles(folderPath){
    return new Promise((resolve, reject) =>{
        fs.readdir(folderPath, function(err, files){
            if(err){
                console.log(err)
                reject(err)
                return 
            }
            const deletePromises = files.map((file) =>{
                return new Promise((resolve, reject)=>{
                    fs.unlink(path.join(folderPath, file), function(err){
                        if(err){
                            reject(err)
                        }else{
                            resolve()
                        }
                    })
                })
            })
            Promise.all(deletePromises)
            .then(() => {
                console.log('All files has been deleted')
                resolve()
            }).catch(err =>{
                console.log(`Failes to delete all files in folder ${folderPath}`)
                reject(err)
            })
        })
    })
}
async function uploadVideoToS3(folderPath, video){ // delete files from ./uploads after they have been uploaded
    console.log('im on it....')
    try{
        const readStream = fs.createReadStream(path.join(folderPath, video))
        const extension = video.substr(video.lastIndexOf('.')).slice(1) 
        const key = genKey() + `.${extension}`
        readStream.on('error', (err) => {
            console.log(err)
        })
        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key, 
            ContentType: extension,
            Body: readStream,
            ContentDisposition: 'inline'
        })
        const response = await s3.send(putCommand)
        console.log(response)
        return key 
    }catch(err){
        console.log('uploadVideoToS3 Error', err)
        throw err
    }
}
async function uploadImageToS3(folderPath, image){
    try{
        const readStream = fs.createReadStream(path.join(folderPath, image))
        const extension = image.substr(image.lastIndexOf('.')).slice(1)
        const key = genKey() + `.${extension}`

        readStream.on('error', (err) => console.log(err))

        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: readStream,
            ContentType: extension
        })
        const response = await s3.send(putCommand)
        console.log(response)
        return key 
    }catch(err){
        console.log(err)
        throw err
    }
}
async function invalidateCash(objectKey){
    try{
        const invalidateCommand = new CreateInvalidationCommand({
            DistributionId: process.env.AWS_CLOUD_DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: objectKey,
                Paths: {
                    Quantity: 1,
                    Items: [`/${objectKey}`]
                }
            }
        })
        const response = await CloudFront.send(invalidateCommand)
        return response
    }catch(err){
        console.log(err)
        throw err 
    }
}
async function deleteFromS3(objectKey){
    try{
        const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectKey
        })
        const response = await s3.send(deleteCommand)
        const cloudResponse = await invalidateCash(objectKey) 
        console.log(response, cloudResponse)
        return response
    }catch(err){
        console.log(err)
        throw err
    }
}
module.exports = {
    CreateLessonInEnglish,
    deleteLocalFiles, 
    deleteFromS3, 
    invalidateCash
}