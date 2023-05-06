const { NotFound } = require('../../../Error/ErrorSamples')
const { verifyUserProgress } = require('../../../helperFuncs/verifyUserProgress')
const getUrl = require('../../../helperFuncs/getUrl')
const { StatusCodes } = require('http-status-codes')
const Lesson = require('../../../DB/models/Lesson')
const { levelsArray } = require('../../../imports')
const joi = require('joi')

async function verifyQuery(query){
    try{
        const joiSchema = joi.object({
            lessonId: joi.string().min(10).required(),
            course: joi.string().valid(...levelsArray).insensitive()
        })
        const {error, value} = joiSchema.validate(query)
        if(error) throw error
        value.courseName = value.course.toUpperCase()
        return value 
    }catch(err){
        throw err 
    }
}


const getLesson = async(req, res, next) =>{
    const userId = req.userId 

    try{
        const {lessonId, courseName} = await verifyQuery(req.query)
        const { user, course } = await verifyUserProgress(userId, courseName)
        const lesson = await Lesson.findOne(
            {_id: lessonId, course: courseName}, 
            {comments: 0, homework: 0})
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
        lesson.thumbNail = getUrl(lesson.thumbNail) 
        const tempLesson = {
            lessonId,
            files,
            videos,
            lessonPicture: lesson.thumbNail,
            title: lesson.title,
            description: lesson.description,
            course: courseName
        }
        return res.status(StatusCodes.OK).json({lesson: tempLesson})
    }catch(err){
        return next(err)
    }
}

module.exports = getLesson