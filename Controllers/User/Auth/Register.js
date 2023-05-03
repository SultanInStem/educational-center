const User = require('../../../DB/models/User')
const joi = require('joi')
const { StatusCodes } = require('http-status-codes')
const { getTime } = require('../../../helperFuncs/getTime')
const Course = require('../../../DB/models/Course')
const jwt = require('jsonwebtoken')
const { BadRequest, NotFound } = require('../../../Error/ErrorSamples')
const { levelsArray, transEmailsApi, senderEmailObject } = require('../../../imports')


async function verifyBody(body){
    try{
        const signupSchema = joi.object({
            name: joi.string().required().min(3).max(40),
            email: joi.string().email().required(),
            password: joi.string().min(6).max(12),
            age: joi.number().required(),
            gender: joi.string().max(1).required(),
            courseName: joi.string().valid(...levelsArray).insensitive().required(),
            score: joi.number().required().min(0).max(5) 
        })
        const {error, value} = signupSchema.validate(body)
        if(error) throw error 
        return value 
    }catch(err){
        throw err
    }
}

async function generateVerificationUrl(userId){
    try{
        const token = jwt.sign({userId}, process.env.EMAIL_JWT_HASH, {expiresIn: '1d'})
        const url = process.env.EMAIL_VERIFICATION_CLIENT_DOMAIN + `/${token}`
        return url
    }catch(err){
        throw err
    }
}

const SignUp = async(req, res, next) =>{
    // make sure that email will be sent!

    // limit the number of register attempts  from the same IP adress
    try{
        const {name, email, password, age, gender, courseName, score} = await verifyBody(req.body)
        const courseObj = await Course.findOne({minScore: score})
        const upperCaseCourse = courseName.toUpperCase()
        if(courseObj.name !== upperCaseCourse){
            throw new BadRequest(`Course and score provided do not match`)
        }else if(!courseObj){
            throw new NotFound("Course Not Found")
        }
        const lastActive = getTime()
        const user = new User({
            name, 
            email, 
            password, 
            age, 
            gender, 
            course: upperCaseCourse, 
            progressScore: score,
            currentScore: 0, 
            lastActive: lastActive,
            isEmailSent: true,
            profilePicture: process.env.DEFAULT_PROFILE_PICTURE
        })
        const recevier = [{email: user.email}]
        const verificationUrl = await generateVerificationUrl(user._id)
        const emailContents = {
            sender: senderEmailObject,
            to: recevier,   
            subject: "Veriy your email",
            textContent: `Click this link to verify your email: ${verificationUrl}`
        }
        const emailResponse = await transEmailsApi.sendTransacEmail(emailContents)
        const savedUser = await user.save()
        console.log(savedUser)
        return res.status(StatusCodes.OK).json({msg: `Please verify email sent to ${user.email}`}) 
    }catch(err){
        return next(err)
    }
}

module.exports = SignUp