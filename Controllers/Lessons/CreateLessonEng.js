const {PutObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3')
const  {CreateInvalidationCommand} = require('@aws-sdk/client-cloudfront')
const {s3, CloudFront, levelsArray} = require('../../imports')
const {BadRequest} = require('../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const genKey = require('../../helperFuncs/genS3Key')
const isImage = require('../../helperFuncs/isImage')
const isVideo = require('../../helperFuncs/isVideo')
const Lesson = require('../../DB/models/Lesson')
const Course = require('../../DB/models/Course')
const mongoose = require('mongoose')
const path = require('path')
const joi = require('joi')
const fs = require('fs')
const BUCKET_NAME = process.env.AWS_BUCKET_NAME  
const uploadsFolder = path.join(__dirname, '..', '..', 'uploads')

const CreateLessonInEnglish = async(req, res, next) =>{
    const session = await mongoose.startSession()
    session.startTransaction()
    let abortTransaction = false 
    const modifiedFiles = []
    try{
        const result = await verifyInputs(req)
        const {video, image, jsondata: {title, description, courseName}} = result 
        Aws_Video_Key = await uploadVideoToS3(uploadsFolder, video)
        if(image){
            Aws_Image_Key = await uploadImageToS3(uploadsFolder, image)
        }
        const queryCourse = courseName.toUpperCase()
        const lesson = new Lesson({
            thumbNail: Aws_Image_Key,
            title: title,
            description,
            videos: {
                english: Aws_Video_Key
            },
            course: queryCourse
        }) 
        const uploadedLesson = await lesson.save({session})
        if(!uploadedLesson){
            throw new mongoose.Error('mongo error')
        }
        const course = await Course.findOneAndUpdate({name: queryCourse}, {$push: {lessons: lesson._id}}, {session}) 
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

const TestVerifyInputs = async (req, res, next) =>{
    try{
        const result = await verifyInputs(req)
        console.log(result)
        return res.status(StatusCodes.OK).json({msg: 'this is a test router'})
    }catch(err){
        console.log(err)
        return next(err)
    }
}
async function verifyInputs(req){
    const joiSchema = joi.object({
        courseName: joi.string().valid(...levelsArray).insensitive(),
        title: joi.string().min(4).max(20),
        description: joi.string().min(5)
    })
    try{
        const {jsondata} = req.body 
        if(!jsondata) throw new BadRequest("Provide all of the necessary information regarding the lssons")
        const parsedJson = await JSON.parse(jsondata) 
        const {error, value} = joiSchema.validate(parsedJson)
        if(error){
            console.log(error)
            throw error
        }
        const files = await new Promise((resolve, reject) => {
            fs.readdir(uploadsFolder, function (err, files) {
              if(err){
                reject(err); // pass the error to the callback function
              }
              let imageNumber = 0 
              let videoNumber = 0 
              files.forEach(item => {
                    if(isVideo(item)){
                      videoNumber += 1 
                    }else if(isImage(item)){
                        imageNumber += 1 
                    }
                })
                if(videoNumber !== 1){
                    reject(new BadRequest(`One video is allowed, you provided ${videoNumber}`))
                }else if(imageNumber > 1){
                    reject(new BadRequest(`Only one video is allowed, you provided ${imageNumber}`))
                }
              resolve(files); // pass the result to the callback function
            });
        });
        return {files, jsondata: value}
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
    invalidateCash,
    TestVerifyInputs
}