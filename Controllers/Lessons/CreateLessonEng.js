const {PutObjectCommand, DeleteObjectCommand} = require('@aws-sdk/client-s3')
const  {CreateInvalidationCommand} = require('@aws-sdk/client-cloudfront')
const {s3, CloudFront, levelsArray} = require('../../imports')
const { BadRequest, CustomError }= require('../../Error/ErrorSamples')
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

const uploadFilesToS3 = async (file) =>{
    console.log('Im on it...')
    try{
        if(!file){
            throw new CustomError("Forgot to pass file to UplodFilesToS3 function")
        }
        const readStream = fs.createReadStream(path.join(uploadsFolder, file.originalname))
        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: file.awsKey,
            Body: readStream,
            ContentType: file.mimetype,
            ContentDisposition: "inline"
        })
        const response = await s3.send(putCommand)
        console.log(response)
        return response
    }catch(err){
        throw err 
    }
}

const CreateLessonInEnglish = async(req, res, next) =>{
    const session = await mongoose.startSession()
    session.startTransaction()
    let abortTransaction = false 
    const modifiedFiles = []
    try{
        const result = await verifyInputs(req)
        const {jsondata} = result
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
        if(modifiedFiles.length !== 2){
            throw new BadRequest(`There must be only one image and video, the number of received files is ${modifiedFiles.length}`)
        }
        const lesson = new Lesson(jsondata)
        const course = await Course.findOneAndUpdate({name: jsondata.course}, {
            $addToSet: {lessons: lesson._id}
        }, {session})
        for(let i = 0; i < modifiedFiles.length; i++){
            const file = modifiedFiles[i]
            await uploadFilesToS3(file)
            if(file.fieldname === 'video'){
                lesson.videos.english = file.awsKey 
            }else if(file.fieldname === 'image'){
                lesson.thumbNail = file.awsKey 
            }
        }
        await lesson.save({session})
        await session.commitTransaction()
        return res.status(StatusCodes.CREATED).json({msg: 'Lesson has been created successfuly', lesson}) 
    }catch(err){ 
        abortTransaction = true 
        for(const item of modifiedFiles){
            const objectKey = item.awsKey
            await invalidateCash(objectKey)
            await deleteFromS3(objectKey)
        }
        console.log('Fils have been deleted from S3 Bucket')
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
    const joiSchema = joi.object({
        course: joi.string().valid(...levelsArray).insensitive(),
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
        const courseNameUppercase = parsedJson.course.toUpperCase()
        parsedJson.course = courseNameUppercase
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
                    reject(new BadRequest(`Only one image is allowed, you provided ${imageNumber}`))
                }
              resolve(files); // pass the result to the callback function
            });
        });
        return {jsondata: parsedJson}
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
                console.log('All files have been deleted')
                resolve()
            }).catch(err =>{
                console.log(`Failes to delete all files in folder ${folderPath}`)
                reject(err)
            })
        })
    })
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
}