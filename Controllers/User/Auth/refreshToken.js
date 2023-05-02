const jwt = require('jsonwebtoken')
const { getTime } = require('../../../helperFuncs/getTime')
const { Unauthorized } = require('../../../Error/ErrorSamples')
const { createAccessToken, createRefreshToken } = require('../../../tokens/generateTokens')
const { StatusCodes } = require('http-status-codes')
const User = require('../../../DB/models/User')

const getNewToken = async(req, res, next) =>{
    try{
        const headers = req.headers.authorization 
        if(!headers || !headers.startsWith('Bearer ')) throw new Unauthorized('You are not unthorized')
        const token = headers.split(' ')[1]
        if(!token){
            throw new Unauthorized('You are not unauthorized')
        }
        jwt.verify(token, process.env.JWT_REFRESH_KEY, async function(err, decoded){
            if(err){
                throw new Unauthorized('Access Token is Expired')
            }
            const currentTime = getTime()
            const user = await User.findOneAndUpdate({_id: decoded.userId}, {lastActive: currentTime}) 
            if(!user) throw new Unauthorized('You are not authorized')
            const accessToken = createAccessToken(decoded.userId)
            const refreshToken = createRefreshToken(decoded.userId)
            return res.status(StatusCodes.OK).json({accessToken, refreshToken})
        })
    }catch(err){
        return next(err)
    }
}
module.exports = getNewToken