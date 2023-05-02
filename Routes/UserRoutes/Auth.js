const express = require('express')
const router = express.Router()

const SignUp = require('../../Controllers/User/Auth/Register')
const Login = require('../../Controllers/User/Auth/Login')
const checkIfRegistered = require('../../Controllers/User/Auth/isRegistered')
const getNewToken = require('../../Controllers/User/Auth/refreshToken')
const verifyEmail = require('../../Controllers/User/Auth/verifyEmail')

router.post('/login', Login)
router.post('/register', SignUp)
router.post('/verifyemail', verifyEmail)

router.post('/isRegistered', checkIfRegistered) 
router.get('/newtoken', getNewToken)
module.exports = router