const { getSignedUrl } = require('@aws-sdk/cloudfront-signer')
const Lesson = require('../../DB/models/Lesson')
const { BadRequest, Unauthorized, NotFound } = require('../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const User = require('../../DB/models/User')
const Course = require('../../DB/models/Course')
const { verifyUserProgress } = require('./GetAllLessons')
const joi = require('joi')
const PRIVATE_KEY = process.env.PRIVATE_KEY
const KEY_PAIR_ID = process.env.AWS_CLOUD_KEY_PAIR_ID 
const { levelsArray } = require('../../imports')
const getLesson = async(req, res, next) =>{
    try{
        const {course, lessonId} = req.query // we need to know level to verify the progress and to improve the read speed with indexes in the future
        const userId = req.userId 
        const isValid = isLevelValid(course)
        const upperCaseLevel = course.toUpperCase()
        if(!isValid.course) throw isValid
        if(!course || !lessonId) throw new BadRequest('provide proper queries')
        const isAllowed = await verifyUserProgress(userId, upperCaseLevel) 
        if(!isAllowed) throw new Unauthorized('You are unauthorized to access this lesson') 


        const lesson = await Lesson.findOne({_id: lessonId, course: upperCaseLevel})
        if(!lesson) throw new NotFound('Lesson Not Found')
        const {videos, title, description, homework, files, thumbNail} = lesson 
        lesson.thumbNail = getUrl(thumbNail) 
        Object.entries(videos).forEach(item =>{
            if(item[1]){
                videos[item[0]] = getUrl(item[1])
            }
        })
        Object.entries(files).forEach(item =>{
            if(item[1]){
                const key = item[1].awsKey
                const url = getUrl(key)
                console.log(url)
                item[1]['url'] = url 
            }
        })
        return res.status(StatusCodes.OK).json({msg: 'oki', lesson})
    }catch(err){
        console.log(err)
        return next(err)
    }
}

function isLevelValid(course){
    const validationSchema = joi.object({
        course: joi.string().valid(...levelsArray).insensitive() 
    })
    const {error, value} = validationSchema.validate({course}) 
    if(error){
        return error
    }else{
        return value 
    }
}

function getUrl(key, expiresIn=1000*60*60*24){
    const url = getSignedUrl({
        url: process.env.AWS_CLOUD_DOMAIN + `/${key}`,
        privateKey: PRIVATE_KEY,
        keyPairId: KEY_PAIR_ID,
        dateLessThan: new Date(Date.now() + expiresIn)
    })
    return url 
}

module.exports = {getLesson}