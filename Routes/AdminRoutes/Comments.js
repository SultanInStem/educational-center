const router = require('./index')
const deleteAllComments = require('../../Controllers/Admin/Comments/deleteComments')


router.delete('/comments/:lessonId', deleteAllComments)

