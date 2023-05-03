const express = require('express')
const router = express.Router()
const deleteAllComments = require('../../Controllers/Admin/Comments/deleteComments')


router.delete('/comments/:lessonId', deleteAllComments)

module.exports = router