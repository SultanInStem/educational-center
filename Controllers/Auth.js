const User = require('../DB/models/User')
const joi = require('joi')
const {createAccessToken, createRefreshToken} = require('../tokens/generateTokens')
const {StatusCodes} = require('http-status-codes')
const {getTime} = require('../helperFuncs/getTime')
const Level = require('../DB/models/Level')
const jwt = require('jsonwebtoken')
const {Unauthorized, BadRequest, NotFound} = require('../Error/ErrorSamples')
const {levelsArray} = require('../imports')

const SignUp = async(req, res, next) =>{
    const signupSchema = joi.object({
        name: joi.string().required().min(3).max(40),
        email: joi.string().email().required(),
        password: joi.string().min(6).max(12),
        age: joi.number().required(),
        gender: joi.string().max(1).required(),
        level: joi.string().valid(...levelsArray).insensitive().required(),
        score: joi.number().required().min(0).max(5) 
    })
    const {error, value} = signupSchema.validate(req.body)
    if(error){
        return next(error)
    }
    try{
        const {name, email, password, age, gender, level, score} = value
        const course = await Level.findOne({minScore: score})
        const upperCaseLevel = level.toUpperCase()
        if(course.level !== upperCaseLevel){
            throw new BadRequest(`Level and score provided do not match`)
        }else if(!course){
            throw new NotFound("Lesson Not Found")
        }
        const lastActive = getTime()
        const user = await User.create({
            name, 
            email, 
            password, 
            age, 
            gender, 
            level: upperCaseLevel, 
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
        if(!user) throw new NotFound("User Not Found")
        const isMatch = await user.CheckPassword(password)
        if(!isMatch) throw new BadRequest("Provided password is incorrect")
        const accessToken = createAccessToken(user._id)
        const refreshToken = createRefreshToken(user._id) 
        const lastActive = getTime()
        await User.findOneAndUpdate({_id: user._id}, {lastActive, isActive: true}) 
        const filteredUser = {
            profilePicture: user.profilePicture, 
            name: user.name,
            progressScore: user.progressScore,
            level: user.level
        }
        const levels = await Level.find() // you might wanna leave out lesson array
        return res.status(StatusCodes.OK).json({
            accessToken, 
            refreshToken, 
            isAdmin: user.isAdmin,
            score: user.progressScore,
            level: user.level
        })
    }catch(err){
        return next(err)
    }
}

const checkIfRegistered = async(req, res, next) =>{
    try{
        const {email} = req.body
        const joiSchema = joi.object({
            email: joi.string().email().min(7)
        })
        const {error, value} = joiSchema.validate(req.body)
        if(error) return next(error)
        const user = await User.findOne({email})
        if(user){
            return res.status(StatusCodes.BAD_REQUEST).json({isRegistered: true})  
        }else{
            return res.status(StatusCodes.OK).json({isRegistered: false})
        }
    }catch(err){
        return next(err)
    }
}

const getNewToken = async(req, res, next) =>{
    try{
        const headers = req.headers.authorization 
        if(!headers || !headers.startsWith('Bearer ')) throw new Unauthorized('You are not unthorized')
        const token = headers.split(' ')[1]
        if(!token){
            throw new Unauthorized('You are not unauthorized')
        }
        jwt.verify(token, process.env.JWT_REFRESH_KEY, async function(err, decoded){
            if(err){
                throw new Unauthorized('Access Token is Expired')
            }
            const user = await User.findOne({_id: decoded.userId}) 
            if(!user) throw new Unauthorized('You are not authorized')
            const accessToken = createAccessToken(decoded.userId)
            const refreshToken = createRefreshToken(decoded.userId)
            return res.status(StatusCodes.OK).json({accessToken, refreshToken})
        })
    }catch(err){
        return next(err)
    }
}

module.exports = {
    SignUp,
    Login,
    checkIfRegistered,
    getNewToken
}