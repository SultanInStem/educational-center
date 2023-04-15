const express = require('express')
const router = express.Router()
const {deleteHomework, editHomework, uploadHomework, getHomework, changeTimeOut, checkHomework} = require('../Controllers/files/homework')
const verifyAdmin = require('../middleware/verifyAdmin')
const authenticate = require("../middleware/authenticate")

router.post('/', verifyAdmin, uploadHomework) // upload homework 
router.delete('/:id', verifyAdmin, deleteHomework) // delete homework 
router.put('/:id', verifyAdmin, editHomework) // edit homework 
router.get("/:lessonId", getHomework)
router.put("/timeout/:lessonId", verifyAdmin, changeTimeOut)
router.put('/check/:lessonId', authenticate, checkHomework)
module.exports = router  