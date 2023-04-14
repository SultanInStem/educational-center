const { CloudFrontClient } = require('@aws-sdk/client-cloudfront')
const { S3, JSONType } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/cloudfront-signer')
const Lesson = require('../../DB/models/Lesson')
const { BadRequest, Unauthorized, NotFound } = require('../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const User = require('../../DB/models/User')
const Level = require('../../DB/models/Level')
const { verifyUserProgress } = require('./GetAllLessons')
const joi = require('joi')
const PRIVATE_KEY = process.env.PRIVATE_KEY
const KEY_PAIR_ID = process.env.AWS_CLOUD_KEY_PAIR_ID 

const getLesson = async(req, res, next) =>{
    try{
        const {level, lessonId} = req.query // we need to know level to verify the progress and to improve the read speed with indexes in the future
        const userId = req.userId 
        const isValid = isLevelValid(level)
        const upperCaseLevel = level.toUpperCase()
        if(!isValid.level) throw isValid
        if(!level || !lessonId) throw new BadRequest('provide proper queries')
        const isAllowed = await verifyUserProgress(userId, upperCaseLevel) 
        if(!isAllowed) throw new Unauthorized('You are unauthorized to access this lesson') 


        const lesson = await Lesson.findOne({_id: lessonId, level: upperCaseLevel})
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

function isLevelValid(level){
    const validationSchema = joi.object({
        level: joi.string().valid('beginner', 'elementary', 'pre-intermediate', 'intermediate', 'ielts').insensitive() 
    })
    const {error, value} = validationSchema.validate({level}) 
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