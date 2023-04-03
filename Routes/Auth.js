const express = require('express')
const router = express.Router()
const {Login, SignUp, checkIfRegistered} = require('../Controllers/Auth')
const {getNewToken} = require('../Controllers/recovery')

router.post('/login', Login)
router.post('/register', SignUp)
router.get('/newtoken', getNewToken)
router.post('/isRegistered', checkIfRegistered) 

module.exports = router