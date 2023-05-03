const joi = require('joi')
const User = require('../../../../DB/models/User')
const verifyJWT = require('../verifyEmailJWT')
const { Unauthorized, NotFound } = require('../../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
async function verifyBody(body){
    try{
        const joiSchema = joi.object({
            token: joi.string().required()
        })
        const {error, value} = joiSchema.validate(body)
        if(error) throw error
        return value 
    }catch(err){
        throw err
    }
}


const changeEmail = async (req, res, next) => {
    try{
        const { token } = await verifyBody(req.body)
        const {userId, newEmail} = await verifyJWT(token)
        if(!userId || !newEmail) throw new Unauthorized("Link was invalid")
        const user = await User.findByIdAndUpdate(userId, 
            {$set: {email: newEmail}}, 
            {new: true, projection: {email: 1}}) 
        if(!user) throw new NotFound("User not found")
        return res.status(StatusCodes.OK).json({msg: "Email has been updated successfuly"})
    }catch(err){
        return next(err)
    }
}

module.exports = { changeEmail }