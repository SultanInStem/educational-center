const router = require('./index')
const uploadFiles = require('../../Controllers/Admin/Files/uploadFiles')
const deleteFile = require('../../Controllers/Admin/Files/deleteFile')
const deleteAllFiles = require('../../Controllers/Admin/Files/deleteAllFiles')

router.post('/lessons/files', uploadFiles)
router.delete('/lessons/files/:id', deleteFile)
router.delete('/lessons/files/:lessonId', deleteAllFiles)
