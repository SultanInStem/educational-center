const express = require('express')
const router = express.Router()
const { getAllLessons } = require('../Controllers/Lessons/GetAllLessons')
const { CreateLessonInEnglish } = require('../Controllers/Lessons/CreateLessonEng')
const authenticate = require('../middleware/authenticate')
const multer = require('multer') 
const verifyAdmin = require('../middleware/verifyAdmin')
const { getLesson } = require('../Controllers/Lessons/getLesson')
const { DeleteLesson } = require('../Controllers/Lessons/DeleteLesson')
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

router.post('/english', [upload.fields(dataSchemaEnglish)], CreateLessonInEnglish)
router.get('/single', authenticate, getLesson) // single?lessonId&level
router.get('/:level', authenticate, getAllLessons)    

router.delete('/:id', verifyAdmin, DeleteLesson)



module.exports = router