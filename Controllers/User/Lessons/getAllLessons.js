const { StatusCodes } = require('http-status-codes')
const { levelsArray } = require('../../../imports')
const Lesson = require('../../../DB/models/Lesson')
const joi = require('joi')
const { NotFound, Forbidden, BadRequest } = require('../../../Error/ErrorSamples')
const getUrl = require('../../../helperFuncs/getUrl')
const { verifyUserProgress } = require('../../../helperFuncs/verifyUserProgress')

async function verifyParams(params){
    try{
        const joiSchema = joi.object({
            course: joi.string().valid(...levelsArray).insensitive()
        })
        const {error, value} = joiSchema.validate(params)
        if(error) throw error 
        value.courseName = value.course.toUpperCase()
        return value
    }catch(err){
        throw err 
    }
}

const getAllLessons = async (req, res, next) => {
    const userId = req.userId
    const { courseName } = await verifyParams(req.params)
    try{
        const { user, course } = await verifyUserProgress(userId, courseName)
        const lessons = await Lesson.find({course: course.name}, {
            title: 1,
            thumbNail: 1,
            course: 1
        })
        const filteredLessons = []
        for(const lesson of lessons){
            let isCompleted = false 
            if(user.completedCourses.includes(course._id) || user.allCompletedLessons.includes(lesson._id)){
                isCompleted = true 
            } 
            const obj = {
                lessonId: lesson._id,
                lessonPicture: getUrl(lesson.thumbNail),
                isCompleted,
                title: lesson.title
            }
            filteredLessons.push(obj)
        }
        const score = user.completedCourses.includes(course._id) ? 1 : user.currentScore
        return res.status(StatusCodes.OK).json({lessons: filteredLessons, currentScore: score})
    }catch(err){
        return next(err) 
    }
}

module.exports = getAllLessons