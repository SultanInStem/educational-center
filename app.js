require('dotenv').config()
const express = require('express')
const app = express()
const connect = require('./DB/connect')
const port = process.env.PORT || 8080
const ErrorHandler = require('./Error/ErrorHandler')

const AuthRouter = require('./Routes/Auth')
const LessonRouter = require('./Routes/Lessons')
const {S3, PutObjectAclCommand, PutObjectCommand} = require('@aws-sdk/client-s3')
const cors = require('cors')
const {NotFound} = require('./Error/NotFound')
const multer = require('multer')
const { StatusCodes } = require('http-status-codes')
const storage = multer.memoryStorage()
const upload = multer({storage})
const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: process.env.AWS_REGION
})
app.use(cors({
    origin: '*'
}))
app.get('/', (req,res) => {
    res.send('<h1>Server is live!<h1/>')
})

app.post('/api/v1/image', upload.single('image'), async(req, res) =>{
    try{
        console.log(req.file)
        console.log(req.files)
        const putCommand = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: req.file.originalname,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        })
        const response = await s3.send(putCommand)
        console.log(response)
        return res.status(StatusCodes.OK).json({msg: 'it is okay'})
    }catch(err){
        console.log(err)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err})
    }
})
app.use(express.json())
app.use('/api/v1', AuthRouter)
app.use('/api/v1', LessonRouter)

app.use(ErrorHandler)
app.use(NotFound)

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
