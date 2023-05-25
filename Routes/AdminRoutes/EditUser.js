const makeAdmin = require('../../Controllers/Admin/EditUsers/makeAdmin')
const removeAdmin = require('../../Controllers/Admin/EditUsers/removeAdmin')
const express = require('express')
const router = express.Router()

router.post('/add/:id', makeAdmin)
router.post('/remove/:id', removeAdmin)
module.exports = router