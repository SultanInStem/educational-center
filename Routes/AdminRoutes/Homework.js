const express = require('express')
const router = express.Router()

const deleteAllQuestions = require('../../Controllers/Admin/Homework/deleteAllQuestions')
const deleteQuestion = require('../../Controllers/Admin/Homework/deleteQuestion')
const uploadQuestion = require('../../Controllers/Admin/Homework/uploadHomework')
const changeTimeLimit = require('../../Controllers/Admin/Homework/changeTimeOut')
const editQuestion = require('../../Controllers/Admin/Homework/editQuestion')

router.post('/homework', uploadQuestion)

router.patch('/homework/timeout/:lessonId', changeTimeLimit)
router.patch('/homework/:id', editQuestion)

router.delete('/homework/:id', deleteQuestion)
router.delete('/homework/:lessonId', deleteAllQuestions)