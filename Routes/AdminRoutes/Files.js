const express = require('express')
const router = express.Router()
const uploadFiles = require('../../Controllers/Admin/Files/uploadFiles')
const deleteFile = require('../../Controllers/Admin/Files/deleteFile')
const deleteAllFiles = require('../../Controllers/Admin/Files/deleteAllFiles')
const { upload } = require('../../imports')

router.post('/', upload.array('files'), uploadFiles)
router.delete('/file', deleteFile)
router.delete('/:lessonId', deleteAllFiles)

module.exports = router
 