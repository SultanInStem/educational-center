const express = require('express')
const router = express.Router()
const {changeProfilePicture} = require('../../Controllers/User/editUser')
const authenticate = require('../../middleware/authenticate')

router.patch('/profile/picture', authenticate, changeProfilePicture)

module.exports = router