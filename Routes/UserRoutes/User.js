const express = require('express')
const router = express.Router()
const changeProfilePicture = require('../../Controllers/User/Profile/changePicture')
const authenticate = require('../../middleware/authenticate')

router.patch('/profile/picture', authenticate, changeProfilePicture)
router.patch('/profile/name')
module.exports = router