const User = require('../../../../DB/models/User')
const bcrypt = require('bcryptjs')
const joi = require('joi')
const jwt = require('jsonwebtoken')
const { BadRequest, NotFound } = require('../../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const changePassword = async (req, res, next) => {
    const verifyBody = (body) => {
        try{
            const joiSchema = joi.object({
                token: joi.string().min(16).required(),
                newPassword: joi.string().min(6).required()
            })
            const {error, value} = joiSchema.validate(body)
            if(error) throw error 
            value.newPassword = value.newPassword.replace(/ /g, "") 
            return value 
        }catch(err){
            throw err 
        }
    }
    try{
        const {token, newPassword} = verifyBody(req.body)
        const decoded = jwt.verify(token, process.env.EMAIL_JWT_HASH)
        if(!decoded || !decoded.userId) throw new BadRequest("Not authenticated to reset the password")
        const userId = decoded.userId
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(newPassword, salt)
        const user = await User.findByIdAndUpdate(userId, {$set: {password: hashedPassword}}, {new: true, projection: {email: 1, password: 1}})
        if(!user) throw new BadRequest("Invalid token")
        return res.status(StatusCodes.OK).json({msg: "Password has been updated successfuly"})    
    }catch(err){
        return next(err)
    }
}

module.exports = changePassword