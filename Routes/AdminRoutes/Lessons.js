const express = require('express')
const router = express.Router()
const multer = require('multer')
const createLessonEng = require('../../Controllers/Admin/Lessons/createLessonEng')
const createLessonRuz = require('../../Controllers/Admin/Lessons/createLessonRuz')
const deleteLesson = require('../../Controllers/Admin/Lessons/deleteLesson')
const getLesson = require('../../Controllers/Admin/Lessons/getLesson')
const changeLessonPicture = require('../../Controllers/Admin/Lessons/EditLesson/changeLessonPicture')
const changeLessonTitle = require('../../Controllers/Admin/Lessons/EditLesson/changeTitle')
const changeDescription = require('../../Controllers/Admin/Lessons/EditLesson/changeDescription')
const addNewVideo = require('../../Controllers/Admin/Lessons/EditLesson/addVideo')
const deleteVideo = require('../../Controllers/Admin/Lessons/EditLesson/deleteVideo')
const updateVideo = require('../../Controllers/Admin/Lessons/EditLesson/updateVideo')
const path = require('path')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        const uploadsPath = path.join(__dirname, '..', '..', 'uploads')
        cb(null, uploadsPath)
    }, 
    filename: function(req, file, cb){
        const fileName = file.originalname.replace(/[\s-]+/g, '')
        file.originalname = fileName
        file.filename = fileName
        cb(null, fileName)
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
router.get('/single', getLesson) 

// EDIT ROUTES
router.patch('/lesson/edit/picture/:lessonId', upload.single("image"), changeLessonPicture)
router.patch('/lesson/edit/title/:lessonId', changeLessonTitle)
router.patch('/lesson/edit/description/:lessonId', changeDescription)
router.post('/lesson/edit/video/:lessonId', upload.single('video'), addNewVideo)
router.delete('/lesson/edit/video', deleteVideo)
router.patch('/lesson/edit/video', upload.single('video'), updateVideo)

module.exports = router