const joi = require('joi')
const User = require('../../../DB/models/User')
const { StatusCodes } = require('http-status-codes')
const checkIfRegistered = async(req, res, next) =>{
    try{
        const {email} = req.body
        const joiSchema = joi.object({
            email: joi.string().email().min(7)
        })
        const {error, value} = joiSchema.validate(req.body)
        if(error) return next(error)
        const user = await User.findOne({email}, {email: 1})
        if(user){
            return res.status(StatusCodes.BAD_REQUEST).json({isRegistered: true})  
        }else{
            return res.status(StatusCodes.OK).json({isRegistered: false})
        }
    }catch(err){
        return next(err)
    }
}
module.exports = checkIfRegistered