const express = require('express')
const router = express.Router()
const multer = require('multer') 
const storage = multer.memoryStorage()
const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    }
})

const {createLesson, getAllLessons, deleteLesson} = require('../Controllers/Lessons')
const authenticate = require('../middleware/authenticate')

router.get('/lessons', authenticate, getAllLessons)

router.post('/lessons/:fileType', upload.single('file'), createLesson)


router.delete('/lessons/:id') // think about implementing delete functionality 

module.exports = router