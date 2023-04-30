const express = require('express')
const router = express.Router()
const setProfilePicture = require('../../Controllers/User/Profile/setPicture')
const changeName = require('../../Controllers/User/Profile/changeName')
router.patch('/edit/profile/picture', setProfilePicture)
router.patch('/edit/profile/name', changeName)
module.exports = router