const express = require('express')
const router = express.Router()
const createQuote = require('../../Controllers/Admin/Quotes/createQuote')
const deleteQuote = require('../../Controllers/Admin/Quotes/deleteQuote')
const updateQuote = require('../../Controllers/Admin/Quotes/updateQuote')
const getAllQuotes = require('../../Controllers/Admin/Quotes/getAllQuotes')

router.post('/', createQuote)
router.patch('/:id', updateQuote)
router.delete('/:id', deleteQuote)
router.get('/', getAllQuotes)


module.exports = router  