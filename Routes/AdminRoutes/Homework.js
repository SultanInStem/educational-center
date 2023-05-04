const express = require('express')
const router = express.Router()

const deleteAllQuestions = require('../../Controllers/Admin/Homework/deleteAllQuestions')
const deleteQuestion = require('../../Controllers/Admin/Homework/deleteQuestion')
const { uploadHomework } = require('../../Controllers/Admin/Homework/uploadHomework')
const changeTimeLimit = require('../../Controllers/Admin/Homework/changeTimeOut')
const editQuestion = require('../../Controllers/Admin/Homework/editQuestion')

router.post('/', uploadHomework)

router.patch('/timeout/:lessonId', changeTimeLimit)
router.patch('/:id', editQuestion)

router.delete('/:id', deleteQuestion)
router.delete('/all/:lessonId', deleteAllQuestions)

module.exports = router