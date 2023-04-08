require('dotenv').config()
const express = require('express')
const app = express()
const connect = require('./DB/connect')
const port = process.env.PORT || 8080
const ErrorHandler = require('./Error/ErrorHandler')

const AuthRouter = require('./Routes/Auth')
const LessonRouter = require('./Routes/Lessons')
const TestRouter = require('./Routes/test')

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
app.use('/api/v1', TestRouter)

app.use(ErrorHandler)
app.use(NotFound)
const path = require('path')
const start = async() =>{ // left off here 
    try{
        await connect(process.env.MONGO_URI)    
        console.log(__dirname)
        app.listen(port, () => console.log('server is up and running'))
    }
    catch(err){
        console.log(err)
    }
}
start()
