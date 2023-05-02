const User = require('../../../DB/models/User')
const {  NotFound, BadRequest } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const jwt = require('jsonwebtoken')
const { transEmailsApi } = require('../../../imports')


async function generateVerificationUrl(userId){
    try{
        const token = jwt.sign({userId}, process.env.EMAIL_JWT_HASH, {expiresIn: '1d'})
        const url = process.env.PASSWORD_RECOVERY_CLIENT_DOMAIN + `/${token}`
        return url
    }catch(err){
        throw err
    }
}

const sendPassswordRecoveryUrl = async (req, res, next) => {
    const userId = req.userId
    try{
        const user = await User.findById(userId, {email: 1, isEmailSent: 1})
        if(!user) throw new NotFound("user not found")
        else if(user.isEmailSent === true) throw new BadRequest(`The email has already been sent to ${user.email}`)
        const senderObject = {
            email: process.env.EMAIL_API_SENDER
        }
        const receiver = [{email: user.email}] 
        const verificationUrl = await generateVerificationUrl(userId)
        const emailResponse = await transEmailsApi.sendTransacEmail({
            sender: senderObject,
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