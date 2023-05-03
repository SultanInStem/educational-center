const express = require('express')
const router = express.Router()
const updateCoursePicture = require('../../Controllers/Admin/Courses/updatePicture')
const { upload } = require('../../imports')

router.patch('/update/picture', upload.single('image'), updateCoursePicture)

module.exports = router