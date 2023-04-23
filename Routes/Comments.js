const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/authenticate')
const { 
    createComment, 
    deleteComment, 
    likeComment, 
    disLikeComment, 
    getComments, 
    deleteAllComments 
} = require('../Controllers/Comments/Comments.js')

const verifyAdmin = require('../middleware/verifyAdmin')


router.get('/:lessonId', authenticate, getComments)
router.post('/:lessonId', authenticate, createComment)  
router.patch('/like', authenticate, likeComment)
router.patch('/dislike', authenticate, disLikeComment)
router.delete('/all/:lessonId', verifyAdmin, deleteAllComments)
router.delete('/:commentId', authenticate, deleteComment)
module.exports = router