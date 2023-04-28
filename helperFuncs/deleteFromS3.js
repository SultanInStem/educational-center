const {s3} = require('../imports')
const { DeleteObjectCommand  } = require('@aws-sdk/client-s3')
async function deleteFromS3(objectKey){
    try{
        const deleteCommand = new DeleteObjectCommand({
            Key: objectKey,
            Bucket: process.env.AWS_BUCKET_NAME 
        })
        const response = await s3.send(deleteCommand)
        return response 
    }catch(err){
        throw err
    }
}

module.exports = deleteFromS3