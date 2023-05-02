const { StatusCodes } = require('http-status-codes')
const { transEmailsApi } = require('../../../imports')
const changeEmail = async (req, res, next) =>{
    try{
        return res.status(StatusCodes.OK).json({msg: 'email has been sent'})
    }catch(err){
        return next(err)
    }
}

module.exports = changeEmail