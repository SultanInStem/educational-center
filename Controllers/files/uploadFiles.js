const { S3, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { NotFound, BadRequest } = require('../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const Lesson = require('../../DB/models/Lesson')
const {s3, CloudFront} = require('../../imports')
const { deleteLocalFiles } = require('../Lessons/CreateLessonEng')
const joi = require('joi')
const path = require('path')
const genKey = require('../../helperFuncs/genS3Key')
const fs = require('fs')
const { CreateInvalidationCommand, CloudFrontClient } = require('@aws-sdk/client-cloudfront')


const uploadLessonFiles = async (req, res, next)=>{
    const {lessonId} = req.body 
    const validationSchema = joi.object({
        lessonId: joi.string().min(6)
    })
    const folderPath = path.join(__dirname, '..', '..', 'uploads')
    let modifiedFiles = []
    try{
        const {error, value} = validationSchema.validate({lessonId}) 
        if(error){
            return next(error)
        }
        await validateInputs(folderPath)
        const lesson = await Lesson.findById(lessonId, {files: 1})
        if(!lesson) throw new NotFound('Lesson Not Found') 
        const files = req.files 
        if(files.length < 1) throw new BadRequest('No Files to Upload') 

        modifiedFiles = files.map(item =>{
            let key = (genKey() + item.originalname)
            key = key.replace(/[^a-zA-Z0-9]/g, '')
            return {
                originalname: item.originalname,
                awsKey: key,
                mimetype: item.mimetype 
            }
        })
        for(let i = 0; i < modifiedFiles.length; i++){
            const file = {
                name: modifiedFiles[i].originalname,
                awsKey: modifiedFiles[i].awsKey
            }
            lesson.files.push(file)
            const response = await uploadToS3(folderPath, modifiedFiles[i])
            console.log(response)
        }
        const updatedLesson = await Lesson.findOneAndUpdate(
            {_id: lessonId},
            {$set: {files: lesson.files}},
            {projection: {files: 1}, new: true}
        )
        if(!updatedLesson) throw new BadRequest('Failed to updated the lesson')
        return res.status(StatusCodes.CREATED).json({msg: 'Files have been uploaded', success: true})
    }catch(err){
        await deleteCloudData(modifiedFiles)
        return next(err)
    }finally{
        await deleteLocalFiles(folderPath) 
    }
}


async function uploadToS3(folderpath, file){
    console.log('Im on it....')
    try{
        const fullPath = path.join(folderpath, file.originalname)
        const readStream = fs.createReadStream(fullPath)
        readStream.on('error', (err) =>{
            console.log(err)
        })
        const putCommand = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.awsKey,
            Body: readStream,
            ContentType: file.mimetype,
            ContentDisposition: 'attachment'
        })
        const response = await s3.send(putCommand)
        return response 
    }catch(err){
        console.log(err)
        throw err
    }
}

async function deleteCloudData(arr){
    try{
        for(let i = 0; i < arr.length; i++){
            const key = arr[i].awsKey
            const res_s3 = await deleteFromS3(key)
            const res_cloud = await invalidateCash(key)
            console.log(res_s3)
            console.log(res_cloud)
        }
        console.log("Files have been deleted from the cloud")
        return true 
    }catch(err){
        return err 
    }
}

async function deleteFromS3(key){
    try{
        const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key 
        })
        const response = await s3.send(deleteCommand)
        return response 
    }catch(err){
        throw err 
    }
}
async function invalidateCash(key){
    try{
        const invalidationCommand = new CreateInvalidationCommand({
            DistributionId: process.env.AWS_CLOUD_DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: key,
                Paths: {
                    Quantity: 1,
                    Items: [`/${key}`]
                }
            }
        })
        const response = await CloudFront.send(invalidationCommand) 
        return response 
    }catch(err){
        throw err 
    }
}

async function validateInputs(folderPath){
    const extensions = ['.pdf', '.jpeg', '.png']
    try{
        const files = new Promise((resolve, reject) =>{
            fs.readdir(folderPath, (err, files) =>{
                files.forEach(item => {
                    const extension = item.substring(item.lastIndexOf('.')).toLowerCase() 
                    if(!extensions.includes(extension)){
                        reject(new BadRequest(`The extension ${extension} is not supported!`))
                    }
                })
                resolve(files)
            })
        })
        return files 
    }catch(err){
        console.log(err)
        throw err 
    }
}
module.exports = {
    uploadLessonFiles
}