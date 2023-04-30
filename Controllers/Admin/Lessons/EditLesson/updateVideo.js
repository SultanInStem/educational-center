const Lesson = require('../../../../DB/models/Lesson')
const joi = require('joi')
const { supportedVideoLanguages } = require('../../../../imports')
const { StatusCodes } = require('http-status-codes')
const { BadRequest, NotFound } = require('../../../../Error/ErrorSamples')
const isVideo = require('../../../../helperFuncs/isVideo')
const checkFile = require('../../../../helperFuncs/checkFileExistance')
const { deleteLocalFiles } = require('../../../../helperFuncs/deleteLocalFiles')
const path = require('path')
const uploadsPath = path.join(__dirname, '..', '..', '..', '..', 'uploads')

async function verifyQuery(query){
    try{
        const joiSchema = joi.object({
            language: joi.string().required().valid(...supportedVideoLanguages).insensitive(),
            lessonId: joi.string().min(10).required()
        })
        const {error, value} = joiSchema.validate(query)
        if(error){
            throw error
        }
        const lowerCaseLng = value.language.toLowerCase()
        value.language = lowerCaseLng
        return value
    }catch(err){
        throw err
    }
}

const updateVideo = async(req, res, next) => {
    try{
        const {language, lessonId} = await verifyQuery(req.query)
        const file = req.file
        if(!file) throw new BadRequest("File wasn't provided") 
        isVideo(file.filename)
        const lesson = await Lesson.findById(lessonId, {videos: 1}) 
        if(!lesson) throw new NotFound(`Lesson with ID ${lessonId} not found`)
        return res.status(StatusCodes.OK).json({msg: "Video has been updated"})
    }catch(err){
        return next(err)
    }finally{
        await deleteLocalFiles(uploadsPath)
    }
}
module.exports = updateVideo