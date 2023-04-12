const express = require('express')
const router = express.Router()
const {postImage, getImage} = require('../Controllers/test')
const multer = require('multer')
const path = require('path')
const storage = multer.diskStorage({
    filename: function(req, file, cb){
        cb(null, file.originalname)
    },
    destination: function(req, file, cb){
        cb(null, path.join(__dirname, '..' ,'uploads'))
    }
})
const upload = multer({storage})
const formDataFields = [{name: 'video', maxCount: 1}, {name: 'image', maxCount: 1}]

router.post('/test/english', upload.fields(formDataFields), postImage)
router.post('/test', getImage)
module.exports = router