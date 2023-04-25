const express = require('express')
const router = express.Router()
const {getCourses} = require('../../Controllers/CommonReqs.js/homeCourses')

router.get('/', getCourses)   

module.exports = router