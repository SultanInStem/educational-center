const jwt = require('jsonwebtoken')
const {StatusCodes} = require('http-status-codes')
const {createAccessToken, createRefreshToken} = require('../tokens/generateTokens')
const getNewToken = async(req, res, next) => {
    try{
        const header = req.headers.authorization 
        if(!header || !header.startsWith('Bearer')) return res.status(StatusCodes.BAD_REQUEST).json({err: 'not authenticated'})
        const token = header.split(' ')
        jwt.verify(token, process.env.JWT_REFRESH_KEY, (err, decoded)=>{
            if(err) return res.status(StatusCodes.BAD_REQUEST).json({err: 'not authenticated'}) // set up next()
            const accessToken = createAccessToken(decoded.userId)
            const refreshToken = createRefreshToken(decoded.userId)
            return res.status(StatusCodes.OK).json({refreshToken, accessToken})
        })
    }catch(err){
        return next(err)
    }
}

module.exports = {
    getNewToken
}