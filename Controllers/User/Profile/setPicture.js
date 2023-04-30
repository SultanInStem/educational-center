const User = require('../../../DB/models/User')
const checkFile = require('../../../helperFuncs/checkFileExistance')
const joi = require('joi')
const { NotFound } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')

async function verifyBody(body){
    try{
        const joiSchema = joi.object({
            imageUrl: joi.string().min(14).required()
        })
        const {error, value} = joiSchema.validate(body)
        if(error) throw error 
        return value 
    }catch(err){
        throw err
    }
}

const setProfilePicture = async(req,res, next) => {
    const userId = req.userId
    try{
        const { imageUrl } = await verifyBody(req.body)
        const isImagePresent = await checkFile(imageUrl)
        if(!isImagePresent) throw new NotFound("This image does not exist, please choose another one")
        const user = await User.findByIdAndUpdate(userId, {$set: {profilePicture: imageUrl}}, {new: true, projection: {profilePicture: 1}})
        if(!user) throw new NotFound(`User with ID ${userId} not found`)
        return res.status(StatusCodes.OK).json({user, msg: 'image has been updated'})
    }catch(err){
        return next(err)
    }
}

module.exports = setProfilePicture