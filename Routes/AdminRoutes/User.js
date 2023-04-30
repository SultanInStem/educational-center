const express = require('express')
const router = express.Router()
const getUsers = require('../../Controllers/Admin/Users/getUsers')
const searchUser = require('../../Controllers/Admin/Users/searchUser')
const getUser = require('../../Controllers/Admin/Users/getUser')
const toggleCommentPermission = require('../../Controllers/Admin/Users/toggleComments')

router.get('/', getUsers)
router.get('/search', searchUser)
router.get('/:userId', getUser)
router.patch('/edit/comment/permission/:userId', toggleCommentPermission)
module.exports = router