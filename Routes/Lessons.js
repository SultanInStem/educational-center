const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/authenticate')
const multer = require('multer') 
const verifyAdmin = require('../middleware/verifyAdmin')
const path = require('path')
const {getAllLessons, getLesson, DeleteLesson, CreateLessonInEnglish, createLessonRuz} = require('../Controllers/Lessons')

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
const dataSchemaEnglish = [
    {name: 'video', maxCount: 1},
    {name: 'image', maxCount: 1}, 
    {name: 'jsondata'}]
    
const dataScheamaRuz = [
    {name: 'videoUz', maxCount: 1}, 
    {name: 'videoRu', maxCount: 1}, 
    {name: 'jsondata'}, 
    {name: 'image', maxCount: 1}]

router.post('/english', [ verifyAdmin, upload.fields(dataSchemaEnglish) ], CreateLessonInEnglish)
router.post('/ruz', [ verifyAdmin, upload.fields(dataScheamaRuz) ], createLessonRuz) 
router.get('/single', authenticate, getLesson) // single?lessonId&level
router.get('/:course', authenticate, getAllLessons)    
router.delete('/:id', verifyAdmin, DeleteLesson)

module.exports = router