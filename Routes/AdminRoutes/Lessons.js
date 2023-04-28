const express = require('express')
const router = express.Router()
const multer = require('multer')
const createLessonEng = require('../../Controllers/Admin/Lessons/createLessonEng')
const createLessonRuz = require('../../Controllers/Admin/Lessons/createLessonRuz')
const deleteLesson = require('../../Controllers/Admin/Lessons/deleteLesson')
const path = require('path')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        const uploadsPath = path.join(__dirname, '..', '..', 'uploads')
        cb(null, uploadsPath)
    }, 
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})

const upload = multer({storage})

const dataSchemaEnglish = [
    {name: 'video', maxCount: 1},
    {name: 'image', maxCount: 1}, 
    {name: 'jsondata'}]
    
const dataScheamaRuz = [
    {name: 'videoUz', maxCount: 1}, 
    {name: 'videoRu', maxCount: 1}, 
    {name: 'jsondata'}, 
    {name: 'image', maxCount: 1}]

    
router.post('/english', upload.fields(dataSchemaEnglish), createLessonEng)
router.post('/ruz', upload.fields(dataScheamaRuz), createLessonRuz)
router.delete('/:id', deleteLesson)


module.exports = router