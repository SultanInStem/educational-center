const express = require('express')
const router = express.Router()
const setProfilePicture = require('../../Controllers/User/Profile/setPicture')
const changeName = require('../../Controllers/User/Profile/changeName')
const changeEmail = require('../../Controllers/User/Profile/changeEmail')
const changePassword = require('../../Controllers/User/Profile/changePassword')
const sendPasswordRecoveryUrl = require('../../Controllers/User/Profile/passwordRecoveryEmail')
const verifyPasswordRecoveryLink = require('../../Controllers/User/Profile/verifyLink')
const resetPassword = require('../../Controllers/User/Profile/resetPassword')

router.patch('/edit/profile/picture', setProfilePicture)
router.patch('/edit/profile/name', changeName)
router.patch('/edit/profile/email', changeEmail)
router.patch('/edit/profile/password', changePassword)


router.post('/edit/profile/password/recovery', sendPasswordRecoveryUrl)
router.get('/edit/profile/password/recovery/:token', verifyPasswordRecoveryLink)
router.patch('/edit/profile/password/recovery/:token', resetPassword)
module.exports = router