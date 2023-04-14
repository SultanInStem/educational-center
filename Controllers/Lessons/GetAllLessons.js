const {getSignedUrl} = require('@aws-sdk/cloudfront-signer')
const { StatusCodes } = require('http-status-codes')
const Level = require('../../DB/models/Level')
const Lesson = require('../../DB/models/Lesson')
const User = require('../../DB/models/User')
const {Unauthorized, NotFound} = require('../../Error/ErrorSamples')
const joi = require('joi')
const PRIVATE_KEY = process.env.PRIVATE_KEY
const KEY_PAIR_ID = process.env.AWS_CLOUD_KEY_PAIR_ID 

async function verifyUserProgress(userId, level){
    try{
        const user = await User.findOne({_id: userId})
        const course = await Level.findOne({level: level})
        if(!course) throw new NotFound('Course not found')
        if(user.progressScore >= course.minScore){
            return {course, minScore: course.minScore}
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
        level: joi.string().valid(
            'beginner',
            'elementary',
            'pre-intermediate',
            'intermediate',
            'upper-intermediate',
            'ielts'
        ).insensitive()
    })
    const {error, value} = ValidationSchema.validate(req.params)
    if(error) return next(error)
    const level = value.level.toUpperCase()
    const userId = req.userId 
    const isAllowed = await verifyUserProgress(userId, level)
    if(!isAllowed) throw new Unauthorized('You are not authorized to access this resource')
    const lessons = isAllowed.course.lessons  
    try{
        const lessonArray = []
        for(const item of lessons){
            const lesson = await Lesson.findOne({_id: item, level: level})
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
        return res.status(StatusCodes.OK).json({lessons: lessonArray})
    }catch(err){
        return next(err) 
    }
}



module.exports = {
    getAllLessons,
    verifyUserProgress
}