const router = require('./index')
const uploadFiles = require('../../Controllers/Admin/Files/uploadFiles')
const deleteFile = require('../../Controllers/Admin/Files/deleteFile')
const deleteAllFiles = require('../../Controllers/Admin/Files/deleteAllFiles')
const multer = require('multer')
const path = require('path')
const storagePath = path.join(__dirname, '..', '..', 'uploads')
const storage = multer.diskStorage({
    filename: function(req, file, cb){
        cb(null, file.originalname)
    },
    destination: function(req, file, cb){
        cb(null, storagePath)
    }
})
const upload = multer({storage})

router.post('/', upload.array('files'), uploadFiles)
router.delete('/file', deleteFile)
router.delete('/:lessonId', deleteAllFiles)

module.exports = router
