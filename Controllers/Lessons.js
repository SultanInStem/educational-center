const {S3, PutObjectCommand} = require('@aws-sdk/client-s3')
const  {CloudFrontClient, CreateInvalidationCommand} = require('@aws-sdk/client-cloudfront')
const {getSignedUrl} = require('@aws-sdk/cloudfront-signer')
const { StatusCodes } = require('http-status-codes')
const genKey = require('../helperFuncs/genS3Key')
const Level = require('../DB/models/Level')
const Lesson = require('../DB/models/Lesson')
const User = require('../DB/models/User')
const joi = require('joi')

const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY 
    },
    region: process.env.AWS_REGION
})

const CloudFront = new CloudFrontClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY, 
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: process.env.AWS_REGION
})


async function verifyUserProgress(userId, level){
    try{
        const user = await User.findOne({_id: userId})
        const course = await Level.findOne({level})
        if(user.progressScore >= course.minScore){
            return {course, minScore: course.minScore}
        }else{
            return false
        }
    }catch(err){
        console.log(err)
        return false 
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
        )
    })
    const {error, value} = ValidationSchema.validate(req.params)
    if(error) return next(error)
    const level = value.level.toUpperCase()
    const userId = req.userId 
    const isAllowed = await verifyUserProgress(userId, level)
    if(!isAllowed) return res.status(StatusCodes.UNAUTHORIZED).json({err: 'access denied'})
    const lessons = isAllowed.course.lessons 
    try{
        const lessonIds = [] 
        for(const item of lessons){
            const lesson = await Lesson.findOne({_id: item}) 
            if(item){
                lessonIds.push(item)
            }
        }
        const lessonArray = []
        for(const item of lessonIds){
            const lesson = await Lesson.findById(item)
            const imageUrl = getSignedUrl({
                url: `${process.env.AWS_CDN_DOMAIN}/${lesson.thumbNail}`,
                privateKey: process.env.AWS_CLOUDFRONT_PRIVATE_KEY,
                keyPairId: process.env.AWS_CLOUD_KEY_PAIR_ID
            })
            const temp = {imageUrl, title: lesson.title}
            console.log(imageUrl)
            lessonArray.push(temp)
         }
    

        return res.status(StatusCodes.OK).json({lessonArray})
    }catch(err){
        return next(err) 
    }
}


const deleteLesson = async(req, res, next) => { // only for admins 

}

const editLesson = async (req, res, next) => {

}

module.exports = {
    getAllLessons,
    deleteLesson,
}