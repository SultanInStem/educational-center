const express = require('express')
const router = express.Router()
const {getCourses} = require('../Controllers/CommonReqs.js/homeCourses')
const authenticate = require('../middleware/authenticate')

router.get('/', authenticate, getCourses)

module.exports = router