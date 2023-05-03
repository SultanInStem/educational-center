const {deleteLocalFiles} = require('../../../../helperFuncs/deleteLocalFiles')
const deleteCloudFiles = require('../../../../helperFuncs/deleteCloudFiles')
const path = require('path')
const uploadsPath = path.join(__dirname, '..', '..', '..', '..', 'uploads')
const {NotFound, BadRequest} = require('../../../../Error/ErrorSamples')
const genKey = require('../../../../helperFuncs/genS3Key')
const isImage = require('../../../../helperFuncs/isImage')
const { PutObjectCommand } = require('@aws-sdk/client-s3')
const Lesson = require('../../../../DB/models/Lesson')
const { StatusCodes } = require('http-status-codes')
const { s3 } = require('../../../../imports')
const fs = require('fs')


async function uploadImage(file){
    try{
        if(!file) throw new BadRequest("File wasn't provided")
        const readStream = fs.createReadStream(path.join(uploadsPath, file.originalname))
        const putCommand = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.awsKey,
            Body: readStream,
            ContentType: file.mimetype,
            ContentDisposition: 'inline'
        })
        const response = await s3.send(putCommand)
        return response 
    }catch(err){
        throw err
    }
}

async function verifyFile(file){
    try{
        if(!file) throw new BadRequest("File wasn't provided")
        const isValidImage = isImage(file.filename)
        if(!isValidImage) throw new BadRequest(`Extension ${file.mimetype} is not supported :(`)
        fs.readdir(uploadsPath, (err, files) =>{
            if(files.length !== 1){
                throw new BadRequest(`One image is required, provided ${files.length}`)
            }
        })
        return true 
    }catch(err){
        throw err 
    }
}

const changeLessonPicture = async (req, res, next) => {
    const {lessonId} = req.params
    let oldImageAwsKey = ''
    try{
        const file = req?.file 
        if(!file || file.fieldname !== 'image') throw new BadRequest("File must be provided")
        if(!lessonId) throw new BadRequest("Lesson ID must be provided")
        verifyFile(file)
        const lesson = await Lesson.findById(lessonId, {thumbNail: 1})
        if(!lesson) throw new NotFound(`Lesson with Id ${lessonId} not fou=nd`)
        file.awsKey = genKey(16) + file.originalname
        const uploadToS3 = await uploadImage(file) // upload new image 
        oldImageAwsKey = lesson.thumbNail 
        const updatedLesson = await Lesson.findOneAndUpdate({_id: lessonId}, {$set:{thumbNail: file.awsKey}})
        return res.status(StatusCodes.OK).json({msg: 'Lesson Image Has Been Updated'})
    }catch(err){
        return next(err)
    }finally{
        if(oldImageAwsKey){
            await deleteCloudFiles(oldImageAwsKey)
        }
        await deleteLocalFiles()
    }
}

module.exports = changeLessonPicture