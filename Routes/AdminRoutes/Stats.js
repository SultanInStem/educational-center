const express = require('express')
const router = express.Router()
const getStats = require('../../Controllers/Admin/Stats/getStats')
router.get('/', getStats)

module.exports = router