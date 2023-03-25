const User = require('../DB/models/User')
const joi = require('joi')
const {createAccessToken, createRefreshToken} = require('../tokens/generateTokens')
const {StatusCodes} = require('http-status-codes')
const {getTime} = require('../helperFuncs/getTime')


const SignUp = async(req, res, next) =>{
    const signupSchema = joi.object({
        name: joi.string().required().min(3),
        email: joi.string().email().required(),
        password: joi.string().min(6).max(12),
        age: joi.number().required(),
        gender: joi.string().required(),
        level: joi.string().required().min(5).max(18),
        score: joi.number().required().min(0).max(6) // getting score just for the convenience we could have calculated it here tho
    })
    const {error, value} = signupSchema.validate(req.body)
    if(error){
        return next(error)
    }
    try{
        const {name, email, password, age, gender, level, score} = value
        const lastActive = getTime()
        const user = await User.create({
            name, 
            email, 
            password, 
            age, 
            gender, 
            level, 
            progressScore: score,
            lastActive: lastActive
        })
        const accessToken = createAccessToken(user._id)
        const refreshToken = createRefreshToken(user._id)   
        return res.status(StatusCodes.OK).json({accessToken, refreshToken, user}) // remove user later
    }catch(err){
        return next(err)
    }
}
const Login = async(req, res, next) =>{
    const LoginSchema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required()
    })
    const {error, value} = LoginSchema.validate(req.body)
    if(error){
        return next(error) 
    }
    try{
        const {email, password} = value 
        const user = await User.findOne({email})
        if(!user) return next({notFound: true})
        const isMatch = await user.CheckPassword(password)
        if(!isMatch) return res.status(StatusCodes.BAD_REQUEST).json({err: 'password in incorrect'})
        const accessToken = createAccessToken(user._id)
        const refreshToken = createRefreshToken(user._id) 
        // in the future, we will fetch and send more than just tokens.  
        return res.status(StatusCodes.OK).json({accessToken, refreshToken})
    }catch(err){
        return next(err)
    }
}



module.exports = {
    SignUp,
    Login
}