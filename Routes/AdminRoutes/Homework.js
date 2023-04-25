const router = require('./index')
const deleteAllQuestions = require('../../Controllers/Admin/Homework/deleteAllQuestions')
const deleteQuestion = require('../../Controllers/Admin/Homework/deleteQuestion')
const uploadQuestion = require('../../Controllers/Admin/Homework/uploadHomework')
const changeTimeLimit = require('../../Controllers/Admin/Homework/changeTimeOut')
const editQuestion = require('../../Controllers/Admin/Homework/editQuestion')

router.post('/homework', uploadQuestion)

router.patch('/homework/:lessonId', changeTimeLimit)
router.patch('/homework/:id', editQuestion)

router.delete('/homework/:id', deleteQuestion)
router.delete('/homework/:lessonId', deleteAllQuestions)