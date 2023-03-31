const {S3} = require('@aws-sdk/client-s3')
const  {CloudFrontClient, CreateInvalidationCommand} = require('@aws-sdk/client-cloudfront')
const {getSignedUrl} = require('@aws-sdk/cloudfront-signer')
const { StatusCodes } = require('http-status-codes')
const crypto = require('crypto')
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

const createLesson = async(req, res, next) => { // only for admins 
    const ACTION = req.params.fileType
    try{
        if(ACTION === 'INFO'){
            // description, title, level 
        }else if(ACTION === 'FILE'){
            console.log(req.file.buffer)
            console.log(req.file)
            // videos or image 
        }else if(ACTION === 'QUIZ'){
            // questions 
        }else{
            return res.status(StatusCodes.OK).json({msg: 'no changes have been made'})
        }
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
    createLesson,
    deleteLesson
}