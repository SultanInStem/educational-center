require('dotenv').config()
const express = require('express')
const app = express()
const connect = require('./DB/connect')
const port = process.env.PORT || 8080
const ErrorHandler = require('./Error/ErrorHandler')

const AuthRouter = require('./Routes/Auth')
const LessonRouter = require('./Routes/Lessons')
const FilesRouter = require('./Routes/Files')
const HomeworkRouter = require('./Routes/Homework')

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
app.use('/api/v1/lessons', LessonRouter)
app.use('/api/v1/files', FilesRouter)
app.use('/api/v1/lessons/homework', HomeworkRouter)

app.use(ErrorHandler)
app.use(NotFound)

const start = async() =>{  
    try{
        await connect(process.env.MONGO_URI)
        app.listen(port, () => console.log('server is up and running'))
    }
    catch(err){
        console.log(err)
    }
}
start()
