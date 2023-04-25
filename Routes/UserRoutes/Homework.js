const express = require('express')
const router = express.Router()
const getHomework = require('../../Controllers/User/Homework/getHomework')
const checkHomework = require('../../Controllers/User/Homework/checkHomework')
router.get('/:lessonId', getHomework)
router.put('/check/:lessonId', checkHomework)
module.exports = router  