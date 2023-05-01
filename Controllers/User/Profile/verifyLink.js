const { StatusCodes } = require('http-status-codes')
const User = require('../../../DB/models/User')
const { BadRequest, NotFound } = require('../../../Error/ErrorSamples')
const jwt = require('jsonwebtoken')

async function verfiyJWT(token){
    try{
        jwt.verify(token, process.env.EMAIL_JWT_HASH, (err, decoded) =>{
            if(err) throw new BadRequest("Link is not valid")
            const userId = decoded.userId 
            return userId 
        })
    }catch(err){
        throw err
    }
}

const verifyPasswordLink = async (req, res, next) => {
    const { token } = req.params
    try{
        if(!token) throw new BadRequest("Invalid token")
        const userId = await verfiyJWT(token)
        const user = await User.findById(userId, {name: 1})
        if(!user) throw new NotFound("User not found")
        return res.status(StatusCodes.OK).json({msg: 'okay, link is valid'})
    }catch(err){
        return next(err)
    }
}
module.exports = verifyPasswordLink