const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { uploadLessonFiles } = require('../Controllers/files/uploadFiles')
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        const uploadPath = path.join(__dirname, '..', 'uploads')
        cb(null, uploadPath)
    },
    filename: function(req, file, cb){
        cb(null, file.originalname)
    }
})
const upload = multer({storage})

router.post('/', upload.array('files'), uploadLessonFiles)
router.post('/howework')


module.exports = router 