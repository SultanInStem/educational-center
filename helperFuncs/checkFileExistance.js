const { HeadObjectCommand } = require('@aws-sdk/client-s3')
const { s3 } = require('../imports')
const checkFile = async (objectKey) => {
    try{
        const headCommand = new HeadObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: objectKey
        })
        const response = await s3.send(headCommand)
        return true 
    }catch(err){
        return false
    }
}
module.exports = checkFile