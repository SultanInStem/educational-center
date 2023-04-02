const express = require('express')
const router = express.Router()
const {Login, SignUp} = require('../Controllers/Auth')
const {getNewToken} = require('../Controllers/recovery')
router.post('/login', Login)
router.post('/register', SignUp)
router.get('/newtoken', getNewToken)


module.exports = router