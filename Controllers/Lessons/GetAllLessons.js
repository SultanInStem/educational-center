const { getSignedUrl } = require('@aws-sdk/cloudfront-signer')
const { StatusCodes } = require('http-status-codes')
const Course = require('../../DB/models/Course')
const { levelsArray } = require('../../imports')
const Lesson = require('../../DB/models/Lesson')
const User = require('../../DB/models/User')
const joi = require('joi')
const { NotFound, Forbidden } = require('../../Error/ErrorSamples')
const getUrl = require('../../helperFuncs/getUrl')

async function verifyUserProgress(userId, courseName){
    try{
        const user = await User.findById(userId, {
            profilePicture: 1,
            progressScore: 1,
            completedLessons: 1,
            completedCourses: 1,
            currentScore: 1,
            isAdmin: 1,
            course: 1
        })
        if(!user) throw new NotFound("User not Found")
        const course = await Course.findOne({name: courseName})
        if(!course) throw new NotFound("Course not Found")
        
        if(user.progressScore < course.minScore){
            throw new Forbidden("Not ALlowed to Access This Course Yet")
        }else if(user.progressScore >= course.minScore){
            return {user, course}
        }
    }catch(err){
        throw err
    }
}

const getAllLessons = async (req, res, next) => {
    const ValidationSchema = joi.object({
        course: joi.string().valid(...levelsArray).insensitive()
    })
    const {error, value} = ValidationSchema.validate(req.params)
    if(error) return next(error)
    const userId = req.userId
    const courseName = value.course.toUpperCase()
    try{
        const {user, course} = await verifyUserProgress(userId, courseName)
        const lessons = await Lesson.find({course: course.name}, {
            title: 1,
            thumbNail: 1,
            course: 1
        })
        const filteredLessons = []
        for(const lesson of lessons){
            let isCompleted = false 
            if(user.completedCourses.includes(course._id) || user.completedLessosn.includes(lesson._id)){
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



module.exports = {
    getAllLessons,
    verifyUserProgress
}