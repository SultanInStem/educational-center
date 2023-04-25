const express = require('express')
const router = express.Router()
const getAllLessons = require('../../Controllers/User/Lessons/getAllLessons')
const getLesson = require('../../Controllers/User/Lessons/getLesson')

router.get('/single', getLesson)
router.get('/:course', getAllLessons)    

module.exports = router