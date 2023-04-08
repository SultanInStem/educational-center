const {StatusCodes} = require('http-status-codes')
const mongoose = require('mongoose')
const joi = require('joi')
const { MulterError } = require('multer')
const ErrorHandler = (err, req, res, next) =>{
    console.log('IT WORKS')
    // later handle mongo errors as well
    if(err instanceof mongoose.Error){
        let code = err.code 
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'mongoose error'})
    }else if(err instanceof MulterError){
        let msg = err.message
        console.log('multer error', err)
        return res.status(StatusCodes.BAD_REQUEST).json({err: msg})
    }else if(err instanceof joi.ValidationError){
        let msg = err.details[0].message
        console.log('joi error')
        return res.status(StatusCodes.BAD_REQUEST).json({err: msg})
    }
    if(err instanceof joi.ValidationError){
        console.log('JOI ERROR')
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'Something went wrong'})
}
module.exports = ErrorHandler