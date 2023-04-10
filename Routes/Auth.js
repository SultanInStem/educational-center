const express = require('express')
const router = express.Router()
const {Login, SignUp, checkIfRegistered, getNewToken} = require('../Controllers/Auth')

router.post('/login', Login)
router.post('/register', SignUp)
router.post('/isRegistered', checkIfRegistered) 
router.get('/newtoken', getNewToken)
module.exports = router