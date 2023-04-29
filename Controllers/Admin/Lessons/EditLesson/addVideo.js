const { StatusCodes } = require('http-status-codes')
const Lesson = require('../../../../DB/models/Lesson')
const { supportedVideoLanguages } = require('../../../../imports')
const joi = require('joi')
const { deleteLocalFiles } = require('../../../../helperFuncs/deleteLocalFiles')
const path = require('path')
const { BadRequest, NotFound } = require('../../../../Error/ErrorSamples')
const { HeadObjectCommand } = require('@aws-sdk/client-s3')
const { s3 } = require('../../../../imports')
const uploadsPath = path.join(__dirname, '..', '..', '..', '..', 'uploads')
const isVideo = require('../../../../helperFuncs/isVideo')
const uploadFile = require('../../../../helperFuncs/uploadFileS3')
const genKey = require('../../../../helperFuncs/genS3Key')
const checkFile = require('../../../../helperFuncs/checkFileExistance')

async function isValidLanguage(data){
    try{
        const joiSchema = joi.object({
            language: joi.string().required().valid(...supportedVideoLanguages).insensitive()
        })
        const {error, value} = joiSchema.validate(data)
        if(error) throw error 
        return value.language.toLowerCase()
    }catch(err){
        throw err
    }
}
const addNewVideo = async (req, res, next) => {
    const { lessonId } = req.params 
    try{
        if(lessonId.length < 10) throw new BadRequest("Valid Lesson Id must be provided")
        const language = await isValidLanguage(req.body)
        const file = req.file 
        if(!file) throw new BadRequest("File must be provided")
        isVideo(file.filename)
        const lesson = await Lesson.findById(lessonId, {videos: 1})
        if(!lesson) throw new NotFound(`Lesson with Id ${lessonId} not found`)

        // check if video with the provided language exists 
        const videoKey = lesson.videos[language] 
        const isVideoPresent = await checkFile(videoKey)
        if(isVideoPresent) throw new BadRequest(`Lesson with ${language} language already exists`)

        // start upload 
        file.awsKey = genKey(16) + file.originalname // generate S3 Key 
        const responseS3 = await uploadFile(file)
        const updatedLesson = await Lesson.findByIdAndUpdate(lessonId, 
            {$set: {[`videos.${language}`]: file.awsKey}}, 
            {new: true, projection: {videos: 1}})
        return res.status(StatusCodes.OK).json({msg: 'oki'})
    }catch(err){
        return next(err)
    }finally{
        await deleteLocalFiles(uploadsPath)
    }
}
module.exports = addNewVideo