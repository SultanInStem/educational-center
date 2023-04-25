const User = require('../../DB/models/User')
const joi = require('joi')
const {createAccessToken, createRefreshToken} = require('../../tokens/generateTokens')
const {StatusCodes} = require('http-status-codes')
const {getTime} = require('../../helperFuncs/getTime')
const Course = require('../../DB/models/Course')
const jwt = require('jsonwebtoken')
const {Unauthorized, BadRequest, NotFound} = require('../../Error/ErrorSamples')
const {levelsArray} = require('../../imports')
const SignUp = async(req, res, next) =>{
    const signupSchema = joi.object({
        name: joi.string().required().min(3).max(40),
        email: joi.string().email().required(),
        password: joi.string().min(6).max(12),
        age: joi.number().required(),
        gender: joi.string().max(1).required(),
        courseName: joi.string().valid(...levelsArray).insensitive().required(),
        score: joi.number().required().min(0).max(5) 
    })
    const {error, value} = signupSchema.validate(req.body)
    if(error){
        return next(error)
    }
    try{
        const {name, email, password, age, gender, courseName, score} = value
        const courseObj = await Course.findOne({minScore: score})
        const upperCaseCourse = courseName.toUpperCase()
        if(courseObj.name !== upperCaseCourse){
            throw new BadRequest(`Course and score provided do not match`)
        }else if(!courseObj){
            throw new NotFound("Course Not Found")
        }
        const lastActive = getTime()
        const user = await User.create({
            name, 
            email, 
            password, 
            age, 
            gender, 
            course: upperCaseCourse, 
            progressScore: score,
            currentScore: 0, 
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
            course: user.course
        }
        const courses = await Course.find() // you might wanna leave out lesson array
        return res.status(StatusCodes.OK).json({
            accessToken, 
            refreshToken, 
            isAdmin: user.isAdmin,
            score: user.progressScore,
            course: user.course
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
            const currentTime = getTime()
            const user = await User.findOneAndUpdate({_id: decoded.userId}, {lastActive: currentTime}) 
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