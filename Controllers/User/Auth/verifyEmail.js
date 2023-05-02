const joi = require('joi')
const jwt = require('jsonwebtoken')
const User = require('../../../DB/models/User')
const { NotFound, Unauthorized } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const {createAccessToken, createRefreshToken} = require('../../../tokens/generateTokens')
async function verifyBody(body){
    try{
        const joiSchema = joi.object({
            token: joi.string().required()
        })
        const {error, value} = joiSchema.validate(body)
        if(error) throw error 
        return value 
    }catch(err){
        throw err
    }
}


const verifyEmail = async(req, res, next) =>{
    try{
        const { token } = await verifyBody(req.body)
        const userId = jwt.verify(token, process.env.EMAIL_JWT_HASH, (err, decoded) =>{
            if(err) return false 
            const id = decoded.userId 
            return id
        })
        if(!userId) throw new Unauthorized("Verification link is not valid")
        const user = await User.findByIdAndUpdate(userId, {$set:{isVerified: true}}, {new: true, projection: {isVerified: 1, email: 1}}) 
        if(!user) throw new NotFound("User not found")
        const accessToken = createAccessToken(userId)
        const refreshToken = createRefreshToken(userId)
        return res.status(StatusCodes.OK).json({msg: "Email has been verified", accessToken, refreshToken})
    }catch(err){
        return next(err)
    }
}

module.exports = verifyEmail