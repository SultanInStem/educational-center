const jwt = require('jsonwebtoken')
const { getTime } = require('../../../helperFuncs/getTime')
const { Unauthorized } = require('../../../Error/ErrorSamples')
const { createAccessToken, createRefreshToken } = require('../../../tokens/generateTokens')
const { StatusCodes } = require('http-status-codes')
const User = require('../../../DB/models/User')

const getNewToken = async(req, res, next) =>{
    try{
        const headers = req.headers.authorization 
        if(!headers || !headers.startsWith('Bearer ')) throw new Unauthorized('You are not authorized')
        const token = headers.split(' ')[1]
        if(!token){
            throw new Unauthorized('You are not authorized')
        }
        const isVerified = jwt.verify(token, process.env.JWT_REFRESH_KEY)
        const { userId } = isVerified
        if(!userId || !isVerified) throw new Unauthorized("You are not authorized")
        const accessToken = createAccessToken(userId)
        const refreshToken = createRefreshToken(userId)
        const currentTime = getTime()
        const user = await User.findByIdAndUpdate(userId, {$set: {lastActive: currentTime}}, {projection: {lastActive: 1}})
        if(!user) throw new Unauthorized("You are not authorized")
        
        return res.status(StatusCodes.OK).json({accessToken, refreshToken})
    }catch(err){ 
        return next(err)
    }
}
module.exports = getNewToken