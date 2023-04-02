const express = require('express')
const router = express.Router()
const {createLesson, getAllLessons, deleteLesson} = require('../Controllers/Lessons')
const authenticate = require('../middleware/authenticate')
const multer = require('multer') 
const {S3} = require('@aws-sdk/client-s3')
const multerS3 = require('multer-s3')
const genKey = require('../helperFuncs/genS3Key')
const { StatusCodes } = require('http-status-codes')
const Level = require('../DB/models/Level')
const Lesson = require('../DB/models/Lesson')
const joi = require('joi')
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


router.get('/lessons', getAllLessons) // later on add authentication here 

router.post('/lessons/videoLang', upload.fields(
    [
        {name: 'videoEnglish', maxCount: 1},
        {name: 'videoRussian', maxCount: 1},
        {name: 'videoUzbek', maxCount: 1},
        {name: 'lessonImage', maxCount: 1},
        {name: 'jsonData'}
    ]), async(req, res, next) =>{
    // check if the user is admin later 

    // we will upload homework later on in the seperate request 
    if(!req.files) return res.status(StatusCodes.BAD_REQUEST).json({err: 'bad request'}) 
    const jsonData = JSON.parse(req.body.jsonData)
    const {lang} = req.query
    const JsonDataValidationForm = joi.object({
        title: joi.string().max(40).min(1),
        description: joi.string().min(1).max(80),
        level: joi.string().min(5).max(20).uppercase()
    })
    const {error, value} = JsonDataValidationForm.validate(jsonData)
    if(error){
        return next(error)
    }
    try{
        let mongoVideoObject = {}
        let levelMongoDb = {}
        switch(lang){
            case 'english':
            if(!req.files.videoEnglish[0]) return res.status(StatusCodes.BAD_REQUEST).json({err: 'bad request, file does not exist'})
            const video = req.files.videoEnglish[0] 

            // check if image file exists 
            mongoVideoObject = await Lesson.create({
                title: value.title,
                description: value.description,
                videos: {
                english: video.key 
                }
            })
                // console.log(video)
                // console.log(mongoVideoObject)
            levelMongoDb = await Level.findOneAndUpdate({level: value.level}, {
                $push: {lessons: mongoVideoObject._id}
            }, {new: true})
            console.log(mongoVideoObject, levelMongoDb)
            return res.status(StatusCodes.OK).json({msg: 'success'})
            case 'russian': 
            if(!req.files.videoRussian[0] || !req.files.videoUzbek[0]) return res.status(StatusCodes.BAD_REQUEST).json({err: 'file is missing'})
            const videoUzb = req.files.videoUzbek[0]
            const videoRus = req.files.videoRussian[0]

            mongoVideoObject = await Lesson.create({
                title: value.title,
                description: value.description,
                videos: {
                    russian: videoRus.key,
                    uzbek: videoUzb.key
                }
            })

            levelMongoDb = await Level.findOneAndUpdate({
                level: value.level
            }, {
                $push: {lessons: mongoVideoObject._id}
            }, {new: true})
            console.log(mongoVideoObject, levelMongoDb)
            return res.status(StatusCodes.OK).json({msg: 'success'})
            default:
            return res.status(StatusCodes.BAD_REQUEST).json({err: 'provide the language'})
        }
    }catch(err){
        return next(err)
    }

})


router.delete('/lessons/:id') // think about implementing delete functionality 

module.exports = router