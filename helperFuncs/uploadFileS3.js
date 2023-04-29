const { BadRequest } = require('../Error/ErrorSamples')
const { s3 } = require('../imports')
const { PutObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

const uploadFile = async (file,disposition='inline') =>{
    try{
        console.log('Im on it')
        if(!file) throw new BadRequest("File wasn't provided")
        const filePath = path.join(__dirname, '..', 'uploads', file.originalname)
        const readStream = fs.createReadStream(filePath)
        readStream.on("error", (err) => console.log(err))
        const putCommand = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: file.awsKey,
            Body: readStream,
            ContentType: file.mimetype,
            ContentDisposition: disposition
        })
        const response = await s3.send(putCommand)
        console.log(response)
        return response
    }catch(err){
        throw err
    }
}

module.exports = uploadFile