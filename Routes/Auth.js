const express = require('express')
const router = express.Router()
const {Login, SignUp} = require('../Controllers/Auth')
router.post('/login', Login)
router.post('/register', SignUp)


module.exports = router