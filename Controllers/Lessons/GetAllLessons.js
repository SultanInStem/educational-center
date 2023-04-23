const { Unauthorized, NotFound } = require('../../Error/ErrorSamples')
const { getSignedUrl } = require('@aws-sdk/cloudfront-signer')
const { StatusCodes } = require('http-status-codes')
const Course = require('../../DB/models/Course')
const { levelsArray } = require('../../imports')
const Lesson = require('../../DB/models/Lesson')
const User = require('../../DB/models/User')
const joi = require('joi')
const PRIVATE_KEY = process.env.PRIVATE_KEY
const KEY_PAIR_ID = process.env.AWS_CLOUD_KEY_PAIR_ID 

async function verifyUserProgress(userId, courseName){
    try{
        const user = await User.findOne({_id: userId})
        const course = await Course.findOne({name: courseName})
        if(!course) throw new NotFound('Course not found')
        if(user.progressScore >= course.minScore){
            return {course, minScore: course.minScore, currentProgress: user.currentScore}
        }else{
            return false
        }
    }catch(err){
        console.log(err)
        throw err 
    }
}

const getAllLessons = async (req, res, next) => {
    const ValidationSchema = joi.object({
        course: joi.string().valid(...levelsArray).insensitive()
    })
    const {error, value} = ValidationSchema.validate(req.params)
    if(error) return next(error)
    const courseName = value.course.toUpperCase()
    const userId = req.userId 
    const isAllowed = await verifyUserProgress(userId, courseName)
    try{
        if(!isAllowed) throw new Unauthorized('You are not authorized to access this resource')
        const lessons = isAllowed.course.lessons  
        const currentProgress = isAllowed.currentProgress
        const lessonArray = []
        for(const item of lessons){
            const lesson = await Lesson.findOne({_id: item, course: courseName})
            if(lesson){
                const temp = {
                    title: lesson.title,
                    description: lesson.description,
                    id: lesson._id,
                }
                temp.image = getSignedUrl({
                    url: process.env.AWS_CLOUD_DOMAIN + `/${lesson.thumbNail}`,
                    privateKey: PRIVATE_KEY,
                    keyPairId: KEY_PAIR_ID,
                    dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 36)
                }) 
                lessonArray.push(temp)
            }
        } 
        return res.status(StatusCodes.OK).json({lessons: lessonArray, currentProgress})
    }catch(err){
        return next(err) 
    }
}



module.exports = {
    getAllLessons,
    verifyUserProgress
}