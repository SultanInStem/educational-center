const { BadRequest, Unauthorized, NotFound } = require('../../../Error/ErrorSamples')
const { verifyUserProgress } = require('../../../helperFuncs/verifyUserProgress')
const getUrl = require('../../../helperFuncs/getUrl')
const { StatusCodes } = require('http-status-codes')
const Lesson = require('../../../DB/models/Lesson')
const { levelsArray } = require('../../../imports')
const joi = require('joi')

const joiValidation = (course) =>{
    try{
        const schema = joi.object({
            course: joi.string().valid(...levelsArray).insensitive()
        })
        const {error, value} = schema.validate({course})
        if(error){
            throw new BadRequest("Invalid input")
        }
        return true
    }catch(err){
        throw err
    }
}
const getLesson = async(req, res, next) =>{
    const userId = req.userId 
    const {lessonId, course} = req.query
    const courseNameUpper = course.toUpperCase()
    try{
        if(!lessonId) throw new BadRequest("Lesson ID is missing")
        joiValidation(courseNameUpper) // checks the provided course 
        const {user, course} = await verifyUserProgress(userId, courseNameUpper)
        const lesson = await Lesson.findOne(
            {_id: lessonId, course: courseNameUpper}, 
            {proptertyToExclude: 0, comments: 0, homework: 0})
        if(!lesson) throw new NotFound("Lesson Not Found")
        const videos = lesson.videos
        const files = lesson.files
        for(const [key, value] of Object.entries(videos)){ // generates URLs for videos 
            if(value){
                videos[key] = getUrl(value)
            }
        }
        for(let i = 0; i < files.length; i++){ // generates URLs for attached files 
            const file = files[i]
            if(file){
                files[i] = getUrl(file.awsKey)
            }
        }
        lesson.thumbNail = getUrl(lesson.thumbNail) // url for the thumbNail
        const tempLesson = {
            lessonId,
            files,
            videos,
            lessonPicture: lesson.thumbNail,
            title: lesson.title,
            description: lesson.description,
            course: courseNameUpper
        }
        return res.status(StatusCodes.OK).json({lesson: tempLesson})
    }catch(err){
        console.log(err)
        return next(err)
    }
}

module.exports = getLesson