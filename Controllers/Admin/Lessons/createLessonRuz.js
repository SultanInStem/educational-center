const {PutObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3')
const {CreateInvalidationCommand} = require('@aws-sdk/client-cloudfront')
const { BadRequest } = require('../../../Error/ErrorSamples')
const { deleteLocalFiles } = require('../../../helperFuncs/deleteLocalFiles')
const isVideo = require('../../../helperFuncs/isVideo')
const isImage = require('../../../helperFuncs/isImage')
const genKey = require('../../../helperFuncs/genS3Key')
const { StatusCodes } = require('http-status-codes')
const Lesson = require('../../../DB/models/Lesson')
const Course = require('../../../DB/models/Course')
const mongoose = require('mongoose')
const path = require('path')
const joi = require('joi')
const fs = require('fs')
const {
    s3, 
    CloudFront, 
    levelsArray, 
} = require('../../../imports')
const uploadsFolderPath = path.join(__dirname, '..', '..', 'uploads')

const deleteCloudFiles = require('../../../helperFuncs/deleteCloudFiles')

async function verifyInputs(req){
    const jsondataValidation = joi.object({
        course: joi.string().valid(...levelsArray).insensitive(),
        title: joi.string().min(4).max(30),
        description: joi.string().min(5)
    })
    try{
        const {jsondata} = req.body
        if(!jsondata) throw BadRequest("Provide all of the essential information regarding the lesson")
        const parsedJson = await JSON.parse(jsondata)
        const {error, value} = jsondataValidation.validate(parsedJson)
        if(error) throw error
        let videoNumber = 0; 
        let imageNumber = 0; 
        const uppercaseLevel = value.course.toUpperCase()
        value.course = uppercaseLevel 
        const files = await new Promise((resolve, reject) =>{
            fs.readdir(uploadsFolderPath, (err,files) =>{
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
        const {json} = await verifyInputs(req)
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
                    awsKey: genKey(16) + newFileName
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
        const course = await Course.findOneAndUpdate({name: json.course}, { 
            $push: {lessons: lesson._id}
        }, {new: true, session})
        if(!course){
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