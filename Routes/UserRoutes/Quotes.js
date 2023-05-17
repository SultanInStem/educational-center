const express = require('express')
const router = express.Router()
const { getQuote } = require('../../Controllers/User/Quotes/getQuotes')

router.get('/', getQuote)

module.exports = router