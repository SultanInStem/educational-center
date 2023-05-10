const Lesson = require('../../../../DB/models/Lesson')
const joi = require('joi')
const { supportedVideoLanguages } = require('../../../../imports')
const { StatusCodes } = require('http-status-codes')
const { BadRequest, NotFound } = require('../../../../Error/ErrorSamples')
const isVideo = require('../../../../helperFuncs/isVideo')
const { deleteLocalFiles } = require('../../../../helperFuncs/deleteLocalFiles')
const uploadToS3 = require('../../../../helperFuncs/uploadFileS3')
const checkFile = require('../../../../helperFuncs/checkFileExistance')
const genKey = require('../../../../helperFuncs/genS3Key')
const deleteCloudFiles = require('../../../../helperFuncs/deleteCloudFiles')

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
        const videos = lesson.videos 
        const video = videos[language]
        file.awsKey = genKey(16) + file.originalname // generate S3 key 
        // upload new file 
        const uploadedFile = await uploadToS3(file)
        // delete old file if it exists 
        const isVideoPresent = await checkFile(video)
        if(isVideoPresent){ 
            const deletedFile = await deleteCloudFiles(video)
        }
        // update lesson 
        const updatedLesson = await Lesson.findByIdAndUpdate(lessonId, 
            {$set: {[`videos.${language}`]: file.awsKey}},
            {new: true, projection: {videos: 1}})
        return res.status(StatusCodes.OK).json({msg: "Video has been updated successfuly"})
    }catch(err){
        return next(err)
    }finally{
        await deleteLocalFiles()
    }
} 
module.exports = updateVideo