const { StatusCodes } = require('http-status-codes')
const { transEmailsApi, senderEmailObject } = require('../../../../imports')
const { BadRequest, NotFound } = require('../../../../Error/ErrorSamples')
const User = require('../../../../DB/models/User')
const joi = require('joi')
const makeEmailURL = require('../../../../helperFuncs/emailVerificationURL')
async function verifyBody(body){
    try{
        const joiSchema = joi.object({
            newEmail: joi.string().email().required()
        })
        const {error, value} = joiSchema.validate(body)
        if(error) throw error 
        return value 
    }catch(err){
        throw err
    }
}


const sendVerificicationEmail = async (req, res, next) =>{
    const userId = req.userId
    try{
        const {newEmail} = await verifyBody(req.body) 
        const numberOfUsers = await User.count({email: newEmail})
        if(numberOfUsers >= 1) throw new BadRequest("Sorry, user with this email already exists")
        const user = await User.findByIdAndUpdate(userId, {$set: {isEmailSent: true}})
        
        if(!user) throw new NotFound("user not found")
        // else if(user.isEmailSent) throw new BadRequest("Email has already been sent!")
        const receiver = [{email: newEmail}]
        const verificationUrl = await makeEmailURL(process.env.NEW_EMAIL_VERIFICATION_CLIENT_DOMAIN, {userId, newEmail})
        const emailContents = {
            sender: senderEmailObject,
            subject: "Verify email",
            to: receiver,
            textContent: `Click here to verify your new email: ${verificationUrl}`
        }
        const emailResponse = await transEmailsApi.sendTransacEmail(emailContents)
        return res.status(StatusCodes.OK).json({msg: `Email with verification link has been sent to ${newEmail}`})
    }catch(err){
        return next(err)
    }
}
module.exports = {
    sendVerificicationEmail
}