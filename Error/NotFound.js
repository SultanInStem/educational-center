const {StatusCodes} = require('http-status-codes')

const NotFound = (req, res, next) => {
    return res.status(StatusCodes.NOT_FOUND).json({msg: 'resource not found'})
}
module.exports = {
    NotFound
}