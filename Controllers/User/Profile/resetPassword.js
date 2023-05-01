const User = require('../../../DB/models/User')
const { StatusCodes } = require('http-status-codes')
const { BadRequest, NotFound } = require('../../../Error/ErrorSamples')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const joi = require('joi')

async function verifyBody(body){
    try{
        const joiSchema = joi.object({
            newPassword: joi.string().min(6).required()
        })
        const {error, value} = joiSchema.validate(body)
        if(error) throw error
        value.newPassword = value.newPassword.replace(/\s/g, "")
        return value 
    }catch(err){
        throw err
    }
}


async function verfiyJWT(token){
    try{
        const userId = jwt.verify(token, process.env.EMAIL_JWT_HASH, (err, decoded) =>{
            if(err) throw new BadRequest("Link is not valid")
            const { userId } = decoded
            console.log(userId)
            return userId 
        })
        return userId
    }catch(err){
        throw err
    }
}
const resetPassword = async (req, res, next) => {
    const { token } = req.params  
    try{
        const { newPassword } = await verifyBody(req.body)
        const userId = await verfiyJWT(token)
        console.log(userId)
        // if token and password are valid, generate hash...
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(newPassword, salt)
        const user = await User.findByIdAndUpdate(userId, {$set: {password: hashedPassword}}, {projection: {name: 1}})
        if(!user) throw new NotFound("User not found")
        return res.status(StatusCodes.OK).json({msg: 'Password has been reset!', user})
    }catch(err){
        return next(err)
    }
}

module.exports = resetPassword