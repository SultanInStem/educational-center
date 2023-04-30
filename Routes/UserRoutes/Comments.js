const express = require('express')
const router = express.Router()

const getAllCommments = require('../../Controllers/User/Comments/getComments')
const createComment = require('../../Controllers/User/Comments/addComment')
const deleteComment = require('../../Controllers/User/Comments/deleteComment')
const likeComment = require('../../Controllers/User/Comments/likeComment')
const disLikeComment = require('../../Controllers/User/Comments/disLikeComment')

router.get('/all', getAllCommments)
router.post('/:lessonId', createComment)  
router.patch('/like', likeComment)
router.patch('/dislike', disLikeComment)
router.delete('/:commentId', deleteComment)

module.exports = router