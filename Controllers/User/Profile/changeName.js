const User = require('../../../DB/models/User')
const joi = require('joi')
const {NotFound, BadRequest} = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')

async function verifyBody(body){
    try{
        const joiSchema = joi.object({
            name: joi.string().required().min(2).max(20)
        })
        const {error, value} = joiSchema.validate(body)
        if(error) throw error
        return value 
    }catch(err){
        throw err 
    }
}

const changeName = async (req, res, next) => {
    const userId = req.userId 
    try{
        const { name } = await verifyBody(req.body) 
        const user = await User.findByIdAndUpdate(
            userId, 
            {$set: { name: name } }, 
            {new: true, projection: { name: 1 } }
        ); 
        if(!user) throw new NotFound(`User with ID ${userId} not found`)
        return res.status(StatusCodes.OK).json({user})
    }catch(err){
        return next(err)
    }
}
module.exports = changeName