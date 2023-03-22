const {StatusCodes} = require('http-status-codes')
const ErrorHandler = (err, rea, res) =>{
    console.log(err)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'something went wrong'})
}
module.exports = ErrorHandler