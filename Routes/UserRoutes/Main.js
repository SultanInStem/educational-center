const express = require('express')
const router = express.Router()

const AuthRouter = require('./Auth')
const UserRouter = require('./Profile')
const LessonRouter = require('./Lessons')
const HomeworkRouter = require('./Homework')
const CommentRouter = require('./Comments')
const CoursesRouter = require('./Courses')
const QuotesRouter = require('./Quotes')
const PasswordRecoveryRouter = require('./PasswordRecover')
const authenticate = require('../../middleware/authenticate')

router.use('/', AuthRouter)
router.use('/user/password/recovery', PasswordRecoveryRouter)

router.use('/user', authenticate, UserRouter)
router.use('/lessons', authenticate, LessonRouter)
router.use('/lessons/homework', authenticate, HomeworkRouter)
router.use('/lessons/comments', authenticate, CommentRouter)
router.use('/courses', authenticate, CoursesRouter)
router.use('/quotes', authenticate, QuotesRouter)


module.exports = router