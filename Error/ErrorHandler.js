const {StatusCodes} = require('http-status-codes')
const multer = require('multer')
const ErrorHandler = (err, req, res, next) =>{
    console.log(err)
    if(err._original){
        let msg = err.details[0].message 
        return res.status(StatusCodes.BAD_REQUEST).json({err: msg})
    }else if(err.code === 11000){
        return res.status(StatusCodes.BAD_REQUEST).json({err: 'This user already exists'})
    }else if(err.notFound){
        return res.status(StatusCodes.NOT_FOUND).json({err: 'User with this email not found'})
    }else if(err instanceof multer.MulterError){
        // set up more error handles
        return res.status(400).json({err: err.message})
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'Something went wrong'})
}
module.exports = ErrorHandler