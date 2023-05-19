const express = require('express')
const router = express.Router()

const sendRecoveryUrl = require('../../Controllers/User/Profile/ForgotPassword/sendEmail')
const resetPassword = require('../../Controllers/User/Profile/ForgotPassword/changePassword')

router.post('/', sendRecoveryUrl)
router.patch('/', resetPassword)

module.exports = router