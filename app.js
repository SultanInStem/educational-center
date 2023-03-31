require('dotenv').config()
const express = require('express')
const app = express()
const connect = require('./DB/connect')
const port = process.env.PORT || 3001
const ErrorHandler = require('./Error/ErrorHandler')
const AuthRouter = require('./Routes/Auth')
const cors = require('cors')
app.use(cors({
    origin: '*'
}))
app.use(express.json())
app.use('/api/v1', AuthRouter)
app.get('/', (req,res) => {
    res.send('<h1>Back-End Home Page<h1/>')
})
app.use(ErrorHandler)
const start = async() =>{
    try{
        app.listen(port, () => console.log(`server is up on port ${port}`))
        await connect(process.env.MONGO_URI)
        console.log(`server is up on port ${port}`)
    }
    catch(err){
        console.log(err)
    }
}
start()
