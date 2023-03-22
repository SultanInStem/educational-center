require('dotenv').config()
const express = require('express')
const app = express()
const connect = require('./DB/connect')
const port = process.env.PORT || 3001
const ErrorHandler = require('./Error/ErrorHandler')
const AuthRouter = require('./Routes/Auth')

app.use(express.json())
app.use('/api/v1', AuthRouter)


app.use(ErrorHandler)
const start = async() =>{
    try{
        app.listen(port, () => console.log('server is live'))
        await connect(process.env.MONGO_URI)
    }
    catch(err){
        console.log(err)
    }
}
start()
