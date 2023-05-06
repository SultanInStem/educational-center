require('dotenv').config()
const express = require('express')
const app = express()
const connect = require('./DB/connect')
const port = process.env.PORT || 8080
const ErrorHandler = require('./Error/ErrorHandler')
const verifyAdmin = require('./middleware/verifyAdmin')
const authenticate = require('./middleware/authenticate')
const fs = require('fs')
const path = require('path')
const helmet = require('helmet')

const AuthRouter = require('./Routes/UserRoutes/Auth')
const LessonRouter = require('./Routes/UserRoutes/Lessons')
const HomeworkRouter = require('./Routes/UserRoutes/Homework')
const CommentRouter = require('./Routes/UserRoutes/Comments')
const UserRouter = require('./Routes/UserRoutes/Profile')
const CoursesRouter = require('./Routes/UserRoutes/Courses')
const AdminLessonRouter = require('./Routes/AdminRoutes/Lessons')
const AdminFilesRouter = require('./Routes/AdminRoutes/Files')
const AdminStatsRouter = require('./Routes/AdminRoutes/Stats')
const AdminUsersRouter = require('./Routes/AdminRoutes/User')
const AdminCourseRouter = require('./Routes/AdminRoutes/Courses')
const AdminImagesRouter = require('./Routes/AdminRoutes/Images')
const AdminHomeworkRouter = require('./Routes/AdminRoutes/Homework')
const AdminCommentRouter = require('./Routes/AdminRoutes/Comments')

const cors = require('cors')
const {NotFound} = require('./Error/NotFound')
app.use(express.json())
app.use(cors({
    origin: '*'
}))
app.use(helmet())

app.get('/', (req,res) => {
    res.send('<h1>Server is live!<h1/>')
})
const router = express.Router() 
router.use('/', AuthRouter)
router.use('/user', authenticate, UserRouter)
router.use('/lessons', authenticate, LessonRouter)
router.use('/lessons/homework', authenticate, HomeworkRouter)
router.use('/lessons/comments', authenticate, CommentRouter)
router.use('/courses', authenticate, CoursesRouter)


// admin end points 
router.use('/admin/lessons', verifyAdmin, AdminLessonRouter)
router.use('/admin/lessons/files', verifyAdmin, AdminFilesRouter)
router.use('/admin/stats', verifyAdmin, AdminStatsRouter)
router.use('/admin/users', verifyAdmin, AdminUsersRouter)
router.use('/admin/images', verifyAdmin, AdminImagesRouter)
router.use('/admin/courses', verifyAdmin, AdminCourseRouter)
router.use('/admin/homework', verifyAdmin, AdminHomeworkRouter)
router.use('/admin/comments', verifyAdmin, AdminCommentRouter)
app.use('/api/v1', router)

app.use(ErrorHandler)
app.use(NotFound)


const start = async() =>{  
    try{
        await connect(process.env.MONGO_URI)
        const uploadsPath = path.join(__dirname, '.', 'uploads')    
        if(!fs.existsSync(uploadsPath)){
            fs.mkdirSync(uploadsPath)
        }
        app.listen(port, () => console.log('server is up and running'))
    }
    catch(err){
        console.log(err)
    }
}
start() 
