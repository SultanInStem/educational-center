const {S3, PutObjectCommand, GetObjectCommand, UploadPartCommand} = require('@aws-sdk/client-s3')
const { StatusCodes } = require('http-status-codes')
const {getSignedUrl} = require('@aws-sdk/cloudfront-signer')
const {CloudFrontClient} = require('@aws-sdk/client-cloudfront')
const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: 'us-east-1'
})
const fs = require('fs')
const PRIVATE_KEY = process.env.PRIVATE_KEY
const path = require('path')
const CloudFront = new CloudFrontClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY, 
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: process.env.AWS_REGION
})
const postImage = async (req, res) =>{
    const uploadsPath = path.join(__dirname, '..', 'uploads')
    fs.readdir(uploadsPath, function(err, files){
        if(err){
            console.log(err)
            return 
        }
        console.log(files)
        files.forEach(async function(file){
            const filePath = path.join(uploadsPath, file)
            const fileStream = fs.createReadStream(filePath)
            let extension = file.split('.')
            extension = extension[extension.length - 1] 
            console.log(extension)
            fileStream.on('error', (err) =>{
                console.log('File error', err)
            })
            const putCommand = new PutObjectCommand({ // distribute this functionalaity later on
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: file,
                Body: fileStream,
                ContentType: extension
            })

            try{
                await s3.send(putCommand)
                console.log('File has been uploaded')
                fs.unlink(path.join(uploadsPath, file), function(err){
                    if(err){
                        console.log('error when deleting a file')
                    }else{
                        console.log('file has been deleted')
                    }
                })
            }catch(err){
                console.log(err)
                console.log("Error while uploading the file")
            }
        })
    })
    return res.status(StatusCodes.OK).json({msg: 'oki'})
}
const getImage = async(req, res) => {
    try{
        const key = req.body.key 
        const url = process.env.AWS_CLOUD_DOMAIN + `/${key}`
        const signedUrl = getSignedUrl({
            url,
            privateKey: PRIVATE_KEY,
            keyPairId: process.env.AWS_CLOUD_KEY_PAIR_ID,
            dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 24) 
        })
        return res.status(200).json({signedUrl})
    }catch(err){
        console.log(err)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err})
    }
}

module.exports = {
    postImage,
    getImage
}