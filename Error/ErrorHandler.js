const {StatusCodes} = require('http-status-codes')
const mongoose = require('mongoose')
const joi = require('joi')
const { MulterError } = require('multer')
const {CustomError} = require('./ErrorSamples')
const {S3} = require('@aws-sdk/client-s3')
const { MongoServerError } = require('mongodb')
const ErrorHandler = (err, req, res, next) =>{
    
    console.log(err)
    if(err instanceof mongoose.Error){

        console.log('Mongoose Error')
        const name = err.name 
        if(name === "CastError"){
            return res.status(StatusCodes.BAD_REQUEST).json({err: err.message}) 
        }
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'mongoose error'})

    }else if(err instanceof MongoServerError){

        console.log('MongoServerError')
        if(err.code === 11000){
            return res.status(StatusCodes.BAD_REQUEST).json({err: 'Mongo Duplicate Error'})
        }

    }else if(err instanceof MulterError){

        let msg = err.message
        return res.status(StatusCodes.BAD_REQUEST).json({err: msg})

    }else if(err instanceof joi.ValidationError){

        console.log('JOI Validation Error')
        let msg = err.details[0].message
        return res.status(StatusCodes.BAD_REQUEST).json({err: msg})

    }else if(err instanceof CustomError){

        console.log('Custom Error')
        return res.status(err.statusCode).json({err: err.message})

    }else if(err.name === 'InvalidAccessKeyId'){

        console.log('InvalidAccessKey Error')
        return res.status(StatusCodes.UNAUTHORIZED).json({err: 'The access key you provided does not exist in our records!'})

    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: err.message ? err.message : 'Something went wrong'})
}
module.exports = ErrorHandler