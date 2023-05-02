const joi = require('joi')
const Course = require('../../../DB/models/Course')
const {StatusCodes} = require('http-status-codes')
const User = require('../../../DB/models/User')
const { getTime } = require('../../../helperFuncs/getTime')
const { createAccessToken, createRefreshToken } = require('../../../tokens/generateTokens')
const { NotFound, BadRequest } = require('../../../Error/ErrorSamples')

async function verifyBody(body){
    try{
        const loginSchema = joi.object({
            email: joi.string().email().required(),
            password: joi.string().required()
        })
        const {error, value} = loginSchema.validate(body)
        if(error) throw error 
        value.password = value.password.replace(/\s+/g, "")
        return value 
    }catch(err){
        throw err
    }
}


const Login = async(req, res, next) =>{
    console.log("IP address: ", req.socket.remoteAddress)
    try{
        const {email, password} = await verifyBody(req.body)
        const user = await User.findOne({email})
        if(!user) throw new NotFound("User Not Found")
        else if(!user.isVerified) throw new BadRequest("Please verify your email first")
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
         // you might wanna leave out lesson array
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
module.exports = Login