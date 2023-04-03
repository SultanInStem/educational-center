const express = require('express')
const router = express.Router()
const {getAllLessons, deleteLesson} = require('../Controllers/Lessons')
const authenticate = require('../middleware/authenticate')
const multer = require('multer') 
const {S3} = require('@aws-sdk/client-s3')
const multerS3 = require('multer-s3')
const genKey = require('../helperFuncs/genS3Key')
const { StatusCodes } = require('http-status-codes')
const Level = require('../DB/models/Level')
const Lesson = require('../DB/models/Lesson')
const mongoose = require('mongoose')
const joi = require('joi')
const isAdmin = require('../helperFuncs/checkIfAdmin')
const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: 'us-east-1'
})

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: function(req, file, cb){
            if(!file) return 
            cb(null, {fieldName: file.fieldname})
        },
        key: function(req, file, cb){
            if(!file) return 
            cb(null, genKey(32) + file.originalname)
        }
    })
})


router.get('/lessons', authenticate, getAllLessons) // later on add authentication here 




router.post('/lessons/english', [authenticate, upload.fields(
    [
        {name: 'video', maxCount: 1},
        {name: 'lessonImage', maxCount: 1},
        {name: 'jsonData'}
    ])], async(req, res, next) =>{
    const admin = await isAdmin(req.userId)
    console.log('isAdmin', isAdmin)
    if(admin === false) return res.status(StatusCodes.BAD_REQUEST).json({err: 'you are not allowed to modify this resource'})         
    if(!req.files || !req.files.video[0] || !req.body.jsonData) return res.status(StatusCodes.BAD_REQUEST).json({err: 'bad request'}) 
    const jsonData = JSON.parse(req.body.jsonData)
    const video = req.files.video[0]
    const JsonDataValidationForm = joi.object({
        title: joi.string().max(40).min(1),
        description: joi.string().min(1).max(80),
        level: joi.string().valid('BEGINNER',
        'ELEMENTARY', 
        'PRE-INTERMEDIATE',
        'INTERMEDIATE', 
        'UPPER-INTERMEDIATE', 
        'IELTS').min(5).max(20)
    })
    let thumbNail = ''
    if(req.files.lessonImage[0]){
        thumbNail = req.files.lessonImage[0]
    }
    const {error, value} = JsonDataValidationForm.validate(jsonData)
    if(error) return next(error)
    const session = await mongoose.startSession()
    try{
        const transaction = await session.withTransaction(async() =>{
            const lesson = await Lesson.create({
                title: value.title, 
                description: value.description, 
                thumbNail,
                videos: {
                    english: video.key
                }
            })
            const level = await Level.findOneAndUpdate({level: value.level}, {$push: {lessons: lesson._id}}, {session})
            if(!level){
                await session.abortTransaction()
                return res.status(StatusCodes.NOT_FOUND).json({err: 'something went wrong'})
            }
            return {level, lesson}
        })
        if(!transaction){
            return res.status(StatusCodes.BAD_REQUEST).json({err: 'something went wrong'})
        }
        return res.status(StatusCodes.CREATED).json({msg: 'lesson has been created'})
    }catch(err){
        await session.abortTransaction()
        return next(err)
    }finally{
        await session.endSession()
        await mongoose.disconnect()
    }
})


router.delete('/lessons/:id') 

module.exports = router