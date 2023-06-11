const { transEmailsApi, senderEmailObject } = require('../../../../imports')
const { StatusCodes } = require('http-status-codes')
const { NotFound, BadRequest } = require('../../../../Error/ErrorSamples')
const joi = require('joi')
const User = require('../../../../DB/models/User')
const jwt = require('jsonwebtoken')
const genToken = (payload) => {
    return jwt.sign({...payload}, process.env.EMAIL_JWT_HASH, {expiresIn: process.env.PASSWORD_RECOVERY_EMAIL_EXPIRATION_TIME})
}
const genVerificationUrl = (token) => {
    const url = process.env.PASSWORD_CHANGE_CLIENT_DOMAIN + `/${token}`
    return url 
}
const sendVerificationEmail = async (req, res, next) => {
    function verifyBody(body){
        try{
            const joiSchema = joi.object({
                email: joi.string().email().required()
            })
            const {error, value} = joiSchema.validate(body)
            if(error) throw error 
            return value 
        }catch(err){
            throw err 
        }
    }
    try{
        const { email } = verifyBody(req.body)
        const user = await User.findOne({email}, {email: 1, isEmailSent: 1})
        if(!user) throw new NotFound("User with this email is not found")
        else if(user.isEmailSent) throw new BadRequest(`Email has already been sent to ${user.email}, request another email in 24 hours`)
        
        const token = genToken({userId: user._id})
        const url = genVerificationUrl(token)
        const msg = `Please click here to reset your password ${url}`
        const emailContents = {
            sender: senderEmailObject,
            subject: "Forgot password",
            to: [{email}],
            textContent: msg
        }
        const sentEmail = await transEmailsApi.sendTransacEmail(emailContents)
        console.log(sentEmail)
        await User.findByIdAndUpdate(user._id, {$set: {isEmailSent: true}}) 
        const responseMsg = `Email has been sent to ${email}. You have ${emailExpTime} until it expires`
        return res.status(StatusCodes.OK).json({msg: responseMsg})
    }catch(err){
        return next(err)
    }
}
module.exports = sendVerificationEmail