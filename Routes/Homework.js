const express = require('express')
const router = express.Router()
const verifyAdmin = require('../middleware/verifyAdmin')
const authenticate = require("../middleware/authenticate")
const {
    uploadHomework,
    deleteHomework,
    editHomework, 
    getHomework, 
    changeTimeOut, 
    checkHomework} = require('../Controllers/files/homework')

router.get("/:lessonId", getHomework)
router.post('/', verifyAdmin, uploadHomework)  
router.put('/:id', verifyAdmin, editHomework) 
router.delete('/:id', verifyAdmin, deleteHomework) 
router.put('/check/:lessonId', authenticate, checkHomework)
router.put("/timeout/:lessonId", verifyAdmin, changeTimeOut)
module.exports = router  