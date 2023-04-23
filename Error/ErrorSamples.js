const {StatusCodes} = require('http-status-codes')
class CustomError extends Error{
    constructor(message){
        super(message)
        this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR
    }
}

class BadRequest extends CustomError{
    constructor(message){
        super(message)
        this.statusCode = StatusCodes.BAD_REQUEST
    }
}
class Unauthorized extends CustomError{
    constructor(message){
        super(message)
        this.statusCode = StatusCodes.UNAUTHORIZED
    }
}

class NotFound extends CustomError{
    constructor(message){
        super(message)
        this.statusCode = StatusCodes.NOT_FOUND 
    }
}

class Forbidden extends CustomError{
    constructor(message){
        super(message)
        this.statusCode = StatusCodes.FORBIDDEN 
    }
}
module.exports = {
    BadRequest,
    CustomError,
    Unauthorized,
    NotFound,
    Forbidden
}