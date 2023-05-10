const { StatusCodes } = require("http-status-codes")
const Lesson = require('../../../../DB/models/Lesson')
const joi = require('joi')
const { supportedVideoLanguages } = require('../../../../imports')
const deleteCloudFIles = require('../../../../helperFuncs/deleteCloudFiles')
const { NotFound, BadRequest } = require("../../../../Error/ErrorSamples")
const checkFile = require('../../../../helperFuncs/checkFileExistance')
async function verifyQuery(data){
    try{
        const joiSchema = joi.object({
            language: joi.string().required().valid(...supportedVideoLanguages).insensitive(),
            lessonId: joi.string().min(10).required()
        })
        const {error, value} = joiSchema.validate(data)
        if(error) throw error
        const lowerCase = value.language.toLowerCase() 
        value.language = lowerCase
        return value 
    }catch(err){
        throw err
    }
}

const deleteVideo = async (req, res, next) => {
    try{
        const {lessonId, language} = await verifyQuery(req.query)
        const lesson = await Lesson.findById(lessonId, {videos: 1})
        if(!lesson) throw new NotFound(`Lesson with Id ${lessonId} not found`)
        const videos = lesson.videos
        const videoKey = videos[language]
        const isVideoPresent = await checkFile(videoKey)
        if(!isVideoPresent) throw new NotFound("File does not exist") 
        await deleteCloudFIles(videoKey)
        const updatedLesson = await Lesson.findByIdAndUpdate(lessonId, 
            {$set: {[`videos.${language}`]: null}}, 
            {new: true, projection: {videos: 1}})
        return res.status(StatusCodes.OK).json({msg: 'Video has been deleted successfuly', updatedLesson})
    }catch(err){
        return next(err)
    }
}
module.exports = deleteVideo