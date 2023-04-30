const { StatusCodes } = require('http-status-codes')
const User = require('../../../DB/models/User')
const {BadRequest, NotFound} = require('../../../Error/ErrorSamples')
const getUrl = require('../../../helperFuncs/getUrl')
const getUser = async(req, res, next) =>{
    const { userId } = req.params
    try{
        if(userId.length < 10) throw new BadRequest("Must Provide Valid User ID")
        const user = await User.findById(userId, {password: 0})
        if(!user) throw new NotFound(`User with ID ${userId} not found`)
        if(user.profilePicture) user.profilePicture = getUrl(user.profilePicture)
        
        return res.status(StatusCodes.OK).json({user})
    }catch(err){
        return next(err)
    }
}

module.exports = getUser