const { StatusCodes } = require('http-status-codes')
const User = require('../../../../DB/models/User')
const { NotFound, BadRequest, Forbidden } = require('../../../../Error/ErrorSamples')
const bcrypt = require('bcryptjs')
const joi = require('joi')

async function verifyBody(body){
    try{
        const joiSchema = joi.object({
            oldPassword: joi.string().min(6).required(),
            newPassword: joi.string().min(6).required()
        })
        const {error, value} = joiSchema.validate(body)
        if(error) throw error 
        value.oldPassword = value.oldPassword.replace(/\s/g, "") 
        value.newPassword = value.newPassword.replace(/\s/g, "")
        return value  
    }catch(err){
        throw err
    }
}

const changePassword = async(req, res, next) => {
    const userId = req.userId 
    try{
        const { oldPassword, newPassword } = await verifyBody(req.body)
        const user = await User.findByIdAndUpdate(userId, {$inc: {attempsToUpdatePassword: 1}}, {new: true, projection: {attempsToUpdatePassword: 1, password: 1}})
        if(!user) throw new NotFound(`User with ID ${userId} not found`)
        else if(user.attempsToUpdatePassword > 10) throw new Forbidden("You have made too many requests to update password. Please try again later")
        const isMatch = await user.CheckPassword(oldPassword)
        if(!isMatch) throw new BadRequest("Password is incorrect, try again") 
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(newPassword, salt)
        const updatedUser = await User.findByIdAndUpdate(userId, {$set: {password: hashedPassword}}, {new: true, projection: {password: 1}})
        return res.status(StatusCodes.OK).json({msg: "Password has been updated successfuly"})
    }catch(err){
        return next(err)
    }
}
module.exports = changePassword 