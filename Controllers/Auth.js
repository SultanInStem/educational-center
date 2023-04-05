const User = require('../DB/models/User')
const joi = require('joi')
const {createAccessToken, createRefreshToken} = require('../tokens/generateTokens')
const {StatusCodes} = require('http-status-codes')
const {getTime} = require('../helperFuncs/getTime')
const Level = require('../DB/models/Level')

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
        console.log(user) 
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
        if(!isMatch) return res.status(StatusCodes.BAD_REQUEST).json({err: 'password is incorrect'})
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
            user: filteredUser, 
            levels
        })
    }catch(err){
        return next(err)
    }
}

const checkIfRegistered = async(req, res, next) =>{
    try{
        const {email} = req.body
        if(!email) return res.status(StatusCodes.BAD_REQUEST).json({err: 'provide email please'})
        const user = await User.findOne({email})
        if(user){
            return res.status(StatusCodes.OK).json({msg: 'user found'})
        }else{
            return res.status(StatusCodes.NOT_FOUND).json({err: 'user not found'})
        }
    }catch(err){
        return next(err)
    }
}

module.exports = {
    SignUp,
    Login,
    checkIfRegistered
}