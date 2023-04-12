const { S3, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { NotFound, BadRequest } = require('../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const Lesson = require('../../DB/models/Lesson')
const { deleteLocalFiles } = require('../Lessons/CreateLessonEng')
const joi = require('joi')
const path = require('path')
const genKey = require('../../helperFuncs/genS3Key')
const fs = require('fs')
const { CreateInvalidationCommand, CloudFrontClient } = require('@aws-sdk/client-cloudfront')

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
        const lesson = await Lesson.findById(lessonId)
        if(!lesson) throw new NotFound('Lesson Not Found') 
        const files = req.files 
        if(files.length < 1) throw new BadRequest('No Files to Upload') 

        modifiedFiles = files.map(item =>{
            let key = (genKey() + item.originalname)
            key = key.replace(/[-\s]+/g, '')
            return {
                originalname: item.originalname,
                aws_key: key,
                mimetype: item.mimetype 
            }
        })
        for(let i = 0; i < modifiedFiles.length; i++){
            const file = {
                name: modifiedFiles[i].originalname,
                awsKey: modifiedFiles[i].aws_key
            }
            lesson.files.push(file) 
            const response = await uploadToS3(folderPath, modifiedFiles[i])
            console.log(response)
        }
        const updatedLesson = await Lesson.findOneAndUpdate({_id: lessonId}, lesson, {new: true})
        if(!updatedLesson) throw new BadRequest('Failed to updated the lesson')
        return res.status(StatusCodes.CREATED).json({msg: 'files have been uploaded'})
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
            Key: file.aws_key,
            Body: readStream,
            ContentType: file.mimetype 
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
            const key = arr[i].aws_key
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
    const extensions = ['.pdf', 'docx', '.pptx', '.txt']
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