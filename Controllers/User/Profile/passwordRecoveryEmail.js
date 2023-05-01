const Sib = require('sib-api-v3-sdk')
const client = Sib.ApiClient.instance 
const apiKey = client.authentications['api-key']
const User = require('../../../DB/models/User')
const {  NotFound, BadRequest } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const jwt = require('jsonwebtoken')


async function generateVerificationUrl(userId){
    try{
        const token = jwt.sign({userId}, process.env.EMAIL_JWT_HASH, {expiresIn: '1d'})
        const url = process.env.EMAIL_VERIFICATION_CLIENT_DOMAIN + `/${token}`
        return url
    }catch(err){
        throw err
    }
}

const sendPassswordRecoveryUrl = async (req, res, next) => {
    const userId = req.userId
    try{
        const user = await User.findById(userId, {email: 1})
        if(!user) throw new NotFound("user not found")
        apiKey.apiKey = process.env.EMAIL_API_KEY
        const transEmailsApi = new Sib.TransactionalEmailsApi()
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
        return res.status(StatusCodes.OK).json({msg: `Verification link has been sent to ${user.email}`})
    }catch(err){
        return next(err)
    }
}
module.exports = sendPassswordRecoveryUrl