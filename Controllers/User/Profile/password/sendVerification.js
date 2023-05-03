const User = require('../../../../DB/models/User')
const {  NotFound, BadRequest } = require('../../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const { transEmailsApi, senderEmailObject } = require('../../../../imports')
const makeEmailURL = require('../../../../helperFuncs/emailVerificationURL')

const sendPassswordRecoveryUrl = async (req, res, next) => {
    const userId = req.userId
    try{
        const user = await User.findById(userId, {email: 1, isEmailSent: 1})
        if(!user) throw new NotFound("user not found")
        else if(user.isEmailSent === true) throw new BadRequest(`The email has already been sent to ${user.email}`)
        const receiver = [{email: user.email}] 
        
        const verificationUrl = await makeEmailURL(process.env.PASSWORD_RECOVERY_CLIENT_DOMAIN, {userId})

        const emailResponse = await transEmailsApi.sendTransacEmail({
            sender: senderEmailObject,
            to: receiver,
            subject: "Password recovery",
            textContent: `Click this link to reset your password: ${verificationUrl}`
        })
        const updatedUser = await User.findByIdAndUpdate(userId, 
            {$set: {isEmailSent: true}}, 
            {new: true, projection: {isEmailSent: 1}})
        return res.status(StatusCodes.OK).json({msg: `Verification link has been sent to ${user.email}`})
    }catch(err){
        return next(err)
    }
}
module.exports = sendPassswordRecoveryUrl