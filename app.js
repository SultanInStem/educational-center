require('dotenv').config()
const express = require('express')
const app = express()
const connect = require('./DB/connect')
const port = process.env.PORT || 8080
const ErrorHandler = require('./Error/ErrorHandler')

const AuthRouter = require('./Routes/Auth')
const LessonRouter = require('./Routes/Lessons')

const cors = require('cors')
const {NotFound} = require('./Error/NotFound')
app.use(cors({
    origin: '*'
}))
app.get('/', (req,res) => {
    res.send('<h1>Server is live!<h1/>')
})
app.use(express.json())
app.use('/api/v1', AuthRouter)
app.use('/api/v1', LessonRouter)

app.use(ErrorHandler)
app.use(NotFound)

const Level = require('./DB/models/Level')
const start = async() =>{ // left off here 
    try{
        await connect(process.env.MONGO_URI)    
        app.listen(port, () => console.log('server is up and running'))
    }
    catch(err){
        console.log(err)
    }
}
start()
