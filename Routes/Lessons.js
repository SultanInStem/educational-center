const express = require('express')
const router = express.Router()
const {getAllLessons, deleteLesson} = require('../Controllers/Lessons')
const {CreateLessonInEnglish} = require('../Controllers/Lessons/CreateLessonEng')
const authenticate = require('../middleware/authenticate')
const multer = require('multer') 
const verifyAdmin = require('../middleware/verifyAdmin')
const path = require('path')
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        const uploadsPath = path.join(__dirname, '..', 'uploads')
        cb(null, uploadsPath)
    }, 
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})
const upload = multer({
    storage
})
const dataSchemaEnglish = [{name: 'video', maxCount: 1}, {name: 'image', maxCount: 1}, {name: 'jsondata'}]
// router.post('/lessons/english', [verifyAdmin, upload.fields(
//     [
//         {name: 'video', maxCount: 1},
//         {name: 'lessonImage', maxCount: 1},
//         {name: 'jsonData'}
//     ])], async(req, res, next) =>{
//         if(!req.files || !req.files.video[0] || !req.body.jsonData){
//             return res.status(StatusCodes.BAD_REQUEST).json({err: 'some files are missing'}) 
//         }
//         const jsonData = JSON.parse(req.body.jsonData)
//         const video = req.files.video[0]
//         const JsonDataValidationForm = joi.object({
//             title: joi.string().max(40).min(1),
//             description: joi.string().min(1).max(80),
//             level: joi.string().valid('BEGINNER',
//             'ELEMENTARY', 
//             'PRE-INTERMEDIATE',
//             'INTERMEDIATE', 
//             'UPPER-INTERMEDIATE', 
//             'IELTS').min(5).max(20)
//         })
//         let thumbNail = ''
//         if(req.files?.lessonImage && req.files.lessonImage?.length >= 1){
//             thumbNail = req.files.lessonImage[0].key 
//         }
//         const {error, value} = JsonDataValidationForm.validate(jsonData)
//         if(error) {
//             if(req.files.video && req.files.video.length > 0){ 
//                 const video = req.files.video[0]
//                 const isDeleted = await pullBack(video.key)
//             }
//             if(req.files.lessonImage && req.files.lessonImage.length > 0){
//                 const image = req.files.lessonImage[0]
//                 const isDeleted = await pullBack(image.key)
//             }
//             return next(error)
//         }
//         const session = await mongoose.startSession()
//         let abortTransaction = false  
//         try{
//             const transaction = await session.withTransaction(async() =>{
//                 const lesson = await Lesson.create({
//                     title: value.title, 
//                     description: value.description, 
//                     thumbNail: thumbNail, 
//                     videos: {
//                         english: video.key
//                     }
//                 })
//                 if(!lesson){
//                     abortTransaction = true 
//                     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'something went wrong'})
//                 }
//                 const level = await Level.findOneAndUpdate({level: value.level}, {$push: {lessons: lesson._id}}, {session})
//                 if(!level){
//                     abortTransaction = true
//                     return res.status(StatusCodes.BAD_REQUEST).json({err: 'something went wrong'}) 
//                 }
//                 return {level, lesson}
//             })
//             if(!transaction){
//                 abortTransaction = true 
//                 return res.status(StatusCodes.BAD_REQUEST).json({err: 'something went wrong'})
//             }
//             return res.status(StatusCodes.CREATED).json({msg: 'lesson has been created'})
//         }catch(err){
//             abortTransaction = true 
//             if(video){
//                 await pullBack(video.key)
//             }else if(thumbNail){
//                 await pullBack(thumbNail)
//             }
//             return next(err)
//         }finally{
//             console.log('ABORT', abortTransaction)
//             if(!abortTransaction){
//                 await session.commitTransaction()
//             }
//             await session.endSession()
//         }
// })

router.post('/english', upload.fields(dataSchemaEnglish), CreateLessonInEnglish)    
router.delete('/:id') 
router.get('/:level', authenticate, getAllLessons) 
    


module.exports = router