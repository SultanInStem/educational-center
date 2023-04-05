const express = require('express')
const router = express.Router()
const {getAllLessons, deleteLesson} = require('../Controllers/Lessons')
const authenticate = require('../middleware/authenticate')
const multer = require('multer') 
const {S3, DeleteObjectCommand} = require('@aws-sdk/client-s3')
const multerS3 = require('multer-s3')
const genKey = require('../helperFuncs/genS3Key')
const { StatusCodes } = require('http-status-codes')
const Level = require('../DB/models/Level')
const Lesson = require('../DB/models/Lesson')
const mongoose = require('mongoose')
const joi = require('joi')
const verifyAdmin = require('../middleware/verifyAdmin')
const {CreateInvalidationCommand, CloudFrontClient} = require('@aws-sdk/client-cloudfront')
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

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: function(req, file, cb){
            if(!file) return 
            cb(null, {
                fieldName: file.fieldname,
                contentDisposition: 'inline',
                contentType: file.mimetype,
            })
            
        },
        key: function(req, file, cb){
            if(!file) return 
            cb(null, genKey(32) + file.originalname)
        }
    })
})

async function pullBack(idOfObject){ 
    const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: idOfObject
    })
    const InvalidationCommand = new CreateInvalidationCommand({
        DistributionId: process.env.AWS_CLOUD_DISTRIBUTION_ID,
        InvalidationBatch: {
            CallerReference: idOfObject,
            Paths: {
                Quantity: 1,
                Items: [`/${idOfObject}`]
            }
        }
    })
    try{
        const deletedObject = await s3.send(deleteCommand)
        await CloudFront.send(InvalidationCommand)
        return true 
    }catch(err){
        console.log(err)
        return false
    }
}
router.post('/lessons/english', [verifyAdmin, upload.fields(
    [
        {name: 'video', maxCount: 1},
        {name: 'lessonImage', maxCount: 1},
        {name: 'jsonData'}
    ])], async(req, res, next) =>{
        if(!req.files || !req.files.video[0] || !req.body.jsonData){
            return res.status(StatusCodes.BAD_REQUEST).json({err: 'some files are missing'}) 
        }
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
        if(req.files?.lessonImage && req.files.lessonImage?.length >= 1){
            thumbNail = req.files.lessonImage[0].key 
        }
        const {error, value} = JsonDataValidationForm.validate(jsonData)
        if(error) {
            if(req.files.video && req.files.video.length > 0){ 
                const video = req.files.video[0]
                const isDeleted = await pullBack(video.key)
            }
            if(req.files.lessonImage && req.files.lessonImage.length > 0){
                const image = req.files.lessonImage[0]
                const isDeleted = await pullBack(image.key)
            }
            return next(error)
        }
        const session = await mongoose.startSession()
        let abortTransaction = false  
        try{
            const transaction = await session.withTransaction(async() =>{
                const lesson = await Lesson.create({
                    title: value.title, 
                    description: value.description, 
                    thumbNail: thumbNail, 
                    videos: {
                        english: video.key
                    }
                })
                if(!lesson){
                    abortTransaction = true 
                    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'something went wrong'})
                }
                const level = await Level.findOneAndUpdate({level: value.level}, {$push: {lessons: lesson._id}}, {session})
                if(!level){
                    abortTransaction = true
                    return res.status(StatusCodes.BAD_REQUEST).json({err: 'something went wrong'}) 
                }
                return {level, lesson}
            })
            if(!transaction){
                abortTransaction = true 
                return res.status(StatusCodes.BAD_REQUEST).json({err: 'something went wrong'})
            }
            return res.status(StatusCodes.CREATED).json({msg: 'lesson has been created'})
        }catch(err){
            abortTransaction = true 
            if(video){
                await pullBack(video.key)
            }else if(thumbNail){
                await pullBack(thumbNail)
            }
            return next(err)
        }finally{
            console.log('ABORT', abortTransaction)
            if(!abortTransaction){
                await session.commitTransaction()
            }
            await session.endSession()
        }
    })
    
    
router.delete('/lessons/:id') 
router.get('/lessons/:level', authenticate, getAllLessons) // later on add authentication here 
    


module.exports = router