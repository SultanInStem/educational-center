const {StatusCodes} = require('http-status-codes')
const ErrorHandler = (err, req, res, next) =>{
    console.log(err)
    if(err._original){
        let msg = err.details[0].message 
        msg = msg.replace(/"/g, '')
        return res.status(StatusCodes.BAD_REQUEST).json({err: msg})
    }else if(err.code === 11000){
        return res.status(StatusCodes.BAD_REQUEST).json({err: 'This user already exists'})
    }else if(err.notFound){
        return res.status(StatusCodes.NOT_FOUND).json({err: 'User with this email not found'})
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'Something went wrong'})
}
module.exports = ErrorHandler