const express = require('express')
const router = express.Router()
const {deleteHomework, editHomework, uploadHomework} = require('../Controllers/files/homework')
const verifyAdmin = require('../middleware/verifyAdmin')


router.post('/', verifyAdmin, uploadHomework) // upload homework 
router.delete('/:id', verifyAdmin, deleteHomework) // delete homework 
router.put('/:id', verifyAdmin, editHomework) // edit homework 

module.exports = router  