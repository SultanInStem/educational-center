const express = require('express')
const router = express.Router()
const getAllCourses = require('../../Controllers/User/Courses/getCourses')

router.get('/', getAllCourses)

module.exports = router