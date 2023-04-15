const {StatusCodes} = require('http-status-codes')
const jwt = require('jsonwebtoken')
const User = require('../DB/models/User')

const authenticate = async (req, res, next) => {
    const authHead = req.headers.authorization 
    if(!authHead || !authHead.startsWith("Bearer")) return res.status(StatusCodes.BAD_REQUEST).json({err: 'not authenticated'})
    const token = authHead.split(' ')[1]
    if(!token) return res.status(StatusCodes.BAD_REQUEST).json({err: 'not authenticated'})
    try{    
        jwt.verify(token, process.env.JWT_ACCESS_KEY, async (err, decoded) =>{
            if(err) return res.status(StatusCodes.BAD_REQUEST).json({err: 'token is expired'})
            const userId = decoded.userId
            const user = await User.findById(userId)
            if(!user) return res.status(StatusCodes.UNAUTHORIZED).json({err: 'not authorized'}) 
            req.userId = userId
            next()
        })
    }catch(err){
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: 'Something went wrong in middleware'})
    }
}

module.exports = authenticate