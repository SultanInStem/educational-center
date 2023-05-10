const {deleteLocalFiles} = require('../../../../helperFuncs/deleteLocalFiles')
const deleteCloudFiles = require('../../../../helperFuncs/deleteCloudFiles')
const path = require('path')
const uploadsPath = path.join(__dirname, '..', '..', '..', '..', 'uploads')
const {NotFound, BadRequest} = require('../../../../Error/ErrorSamples')
const genKey = require('../../../../helperFuncs/genS3Key')
const isImage = require('../../../../helperFuncs/isImage')
const Lesson = require('../../../../DB/models/Lesson')
const { StatusCodes } = require('http-status-codes')
const fs = require('fs')

const uploadS3 = require('../../../../helperFuncs/uploadFileS3')

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
        await verifyFile(file)
        const lesson = await Lesson.findById(lessonId, {thumbNail: 1})
        if(!lesson) throw new NotFound(`Lesson with Id ${lessonId} not found`)
        file.awsKey = genKey(16) + file.originalname
        const uploadToS3 = await uploadS3(file) 
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