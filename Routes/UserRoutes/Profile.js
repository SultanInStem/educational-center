const express = require('express')
const router = express.Router()
const getProfileInfo = require('../../Controllers/User/Profile/getProfileData')
const setProfilePicture = require('../../Controllers/User/Profile/setPicture')
const changeName = require('../../Controllers/User/Profile/changeName')
const { sendVerificicationEmail } = require('../../Controllers/User/Profile/email/sendVerification')
const { changeEmail } = require('../../Controllers/User/Profile/email/resetEmail')
const changePassword = require('../../Controllers/User/Profile/UpdatePassword/changePassword')



router.patch('/edit/profile/picture', setProfilePicture)
router.patch('/edit/profile/name', changeName) 
router.patch('/edit/profile/password', changePassword)


// changing email 
router.post('/edit/profile/email', sendVerificicationEmail) // send email 
router.patch('/edit/profile/email', changeEmail) // change email 

router.get('/profile', getProfileInfo)
module.exports = router