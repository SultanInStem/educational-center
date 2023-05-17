const express = require('express')
const router = express.Router()

const LessonRouter = require('./Lessons')
const FilesRouter = require('./Files')
const StatsRouter = require('./Stats')
const UsersRouter = require('./User')
const ImagesRouter = require('./Images')
const CoursesRouter = require('./Courses')
const CommentRouter = require('./Comments')
const QuoteRouter = require('./Quotes')
const HomeworkRouter = require('./Homework')

router.use('/lessons', LessonRouter)
router.use('/lessons/files', FilesRouter)
router.use('/stats', StatsRouter)
router.use('/users', UsersRouter)
router.use('/images', ImagesRouter)
router.use('/courses', CoursesRouter)
router.use('/homework', HomeworkRouter)
router.use('/comments', CommentRouter)
router.use('/quotes', QuoteRouter)

module.exports = router