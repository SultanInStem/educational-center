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

const cors = require('cors')
const {NotFound} = require('./Error/NotFound')
app.use(express.json())
app.use(cors({
    origin: '*'
}))

app.get('/', (req,res) => {
    res.send('<h1>Server is live!<h1/>')
})
 
app.use('/api/v1', AuthRouter)
app.use('/api/v1/user', authenticate, UserRouter)
app.use('/api/v1/lessons', authenticate, LessonRouter)
app.use('/api/v1/lessons/homework', authenticate, HomeworkRouter)
app.use('/api/v1/lessons/comments', authenticate, CommentRouter)
app.use('/api/v1/courses', authenticate, CoursesRouter)


// admin end points 
app.use('/api/v1/admin/lessons', verifyAdmin, AdminLessonRouter)
app.use('/api/v1/admin/lessons/files', verifyAdmin, AdminFilesRouter)
app.use('/api/v1/admin/stats', verifyAdmin, AdminStatsRouter)
app.use('/api/v1/admin/users', verifyAdmin, AdminUsersRouter)

app.use(ErrorHandler)
app.use(NotFound)

const User = require('./DB/models/User')
const start = async() =>{  
    try{
        await connect(process.env.MONGO_URI)
        const uploadsPath = path.join(__dirname, '.', 'uploads')    
        if(!fs.existsSync(uploadsPath)){
            fs.mkdirSync(uploadsPath)
        }
        console.log(await User.collection.getIndexes())
        app.listen(port, () => console.log('server is up and running'))
    }
    catch(err){
        console.log(err)
    }
}
start()
