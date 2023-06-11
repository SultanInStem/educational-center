const express = require('express')
const router = express.Router()
const uploadAvatar = require('../../Controllers/Admin/Images/uploadAvatar')
const getAvatars = require('../../Controllers/Admin/Images/getAvatars')
const deleteAvatar = require('../../Controllers/Admin/Images/deleteAvatar')
const { updateDefaultImage, getDefaultImages } = require('../../Controllers/Admin/Images/defaultImages')
const { upload } = require('../../imports')

router.post('/avatars', upload.single('image'), uploadAvatar)
router.get('/avatars', getAvatars)
router.delete('/avatars/:imageId', deleteAvatar)

router.patch('/update/default/image', upload.single('image'), updateDefaultImage)
router.get('/default', getDefaultImages)
module.exports = router 