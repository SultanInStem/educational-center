require('dotenv').config()
const express = require('express')
const app = express()
const connect = require('./DB/connect')
const port = process.env.PORT || 8080
const ErrorHandler = require('./Error/ErrorHandler')
const verifyAdmin = require('./middleware/verifyAdmin')
const fs = require('fs')
const path = require('path')
const helmet = require('helmet')


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


const AdminRouter = require('./Routes/AdminRoutes/Main')
const UserRouter = require('./Routes/UserRoutes/Main')

app.use('/api/v1', UserRouter)
app.use('/api/v1/admin', verifyAdmin, AdminRouter)

app.use(ErrorHandler)
app.use(NotFound)
const Quote = require('./DB/models/Quote')
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