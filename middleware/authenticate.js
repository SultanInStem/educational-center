const {StatusCodes} = require('http-status-codes')
const authenticate = async (req, res, next) => {
    try{
        next()
    }catch(err){
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'Something went wrong in middleware'})
    }
}

module.exports = authenticate