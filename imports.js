const path = require('path')
const {S3} = require('@aws-sdk/client-s3')
const { CloudFrontClient } = require('@aws-sdk/client-cloudfront')
const multer = require('multer')
const Sib = require('sib-api-v3-sdk')


const levelsArray = ['beginner', 'elementary', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'ielts']
const supportedVideoFormatsArray = ['.mov', '.mp4', '.avi']
const supportedImageFormatsArray = ['.png', '.jpeg', '.jpg']
const supportedFileExtensions = ['.png', '.jpeg', '.jpg', '.pdf']
const supportedVideoLanguages = ['english', 'russian', 'uzbek']
const client = Sib.ApiClient.instance 
const apiKey = client.authentications['api-key']
apiKey.apiKey = process.env.EMAIL_API_KEY
const transEmailsApi = new Sib.TransactionalEmailsApi()
const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: process.env.AWS_REGION
})

const CloudFront = new CloudFrontClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: process.env.AWS_REGION
})
const senderEmailObject = {
    email: process.env.EMAIL_API_SENDER
}

const uploadsPath = path.join(__dirname, 'uploads')
const storage = multer.diskStorage({
    filename: function(req, file, cb){
        const fileName = file.originalname.replace(/[\s_]+/g, '');
        file.originalname = fileName
        file.filename = fileName
        cb(null, fileName)
    },
    destination: function(req, file, cb){
        cb(null, uploadsPath)
    }
})
const upload = multer({storage})
module.exports = {
    levelsArray,
    s3,
    CloudFront,
    supportedImageFormatsArray,
    supportedVideoFormatsArray,
    supportedVideoLanguages,
    transEmailsApi,
    senderEmailObject,
    supportedFileExtensions,
    upload
}