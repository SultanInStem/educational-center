const express = require('express')
const router = express.Router()
const uploadAvatar = require('../../Controllers/Admin/Images/uploadAvatar')
const getAvatars = require('../../Controllers/Admin/Images/getAvatars')
const deleteAvatar = require('../../Controllers/Admin/Images/deleteAvatar')
const path = require('path')
const multer = require('multer')
const uploadsPath = path.join(__dirname, '..', '..', 'uploads')

const storage = multer.diskStorage({
    filename: function(req, file, cb){
        const fileName = file.originalname.replace(/[\s_]+/g, '');
        cb(null, fileName)
    },
    destination: function(req, file, cb){
        cb(null, uploadsPath)
    }
})

const upload = multer({storage})

router.post('/avatars', upload.single('image'), uploadAvatar)
router.get('/avatars', getAvatars)
router.delete('/avatars/:imageId', deleteAvatar)


module.exports = router 