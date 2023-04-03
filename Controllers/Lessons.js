const {S3, PutObjectCommand} = require('@aws-sdk/client-s3')
const  {CloudFrontClient, CreateInvalidationCommand} = require('@aws-sdk/client-cloudfront')
const {getSignedUrl} = require('@aws-sdk/cloudfront-signer')
const { StatusCodes } = require('http-status-codes')
const genKey = require('../helperFuncs/genS3Key')
const Level = require('../DB/models/Level')
const Lesson = require('../DB/models/Lesson')

const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY 
    },
    region: 'us-east-1'
})

const CloudFront = new CloudFrontClient({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY, 
        secretAccessKey: process.env.AWS_SECRET_KEY
    },
    region: 'us-east-1' // put env var later on 
})


const getAllLessons = async (req, res, next) => { // for users and admins 
    try{

    }catch(err){
        return next(err) 
    }
}


const deleteLesson = async(req, res, next) => { // only for admins 

}

const editLesson = async (req, res, next) => {

}

module.exports = {
    getAllLessons,
    deleteLesson
}