const {StatusCodes} = require('http-status-codes')
const mongoose = require('mongoose')
const joi = require('joi')
const { MulterError } = require('multer')
const ErrorHandler = (err, req, res, next) =>{
    console.log(err)
    // later handle mongo errors as well
    if(err instanceof mongoose.Error){
        let code = err.code 
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'mongoose error'})
    }else if(err instanceof MulterError){
        let msg = err.message
        return res.status(StatusCodes.BAD_REQUEST).json({err: msg})
    }else if(joi.isError(err)){
        let msg = err.details[0].message
        return res.status(StatusCodes.BAD_REQUEST).json({err: msg})
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'Something went wrong'})
}
module.exports = ErrorHandler