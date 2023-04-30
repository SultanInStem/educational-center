const { StatusCodes } = require('http-status-codes')
const User = require('../../../DB/models/User')
const { NotFound, BadRequest } = require('../../../Error/ErrorSamples')
const toggleCommentPermissions = async (req, res, next) =>{
    const { userId } = req.params 
    try{
        if(userId.length < 10) throw new BadRequest("Must Provide Valid User ID")
        const user = await User.findById(userId, {canComment: 1})
        if(!user) throw new NotFound(`User with ID ${userId} not found`)
        const updatedUser = await User.findByIdAndUpdate(userId, 
            {$set: {canComment: !user.canComment}}, 
            {new: true, projection: {canComment: 1}})
        return res.status(StatusCodes.OK).json({canComment: updatedUser.canComment})
    }catch(err){
        return next(err)
    }
}
module.exports = toggleCommentPermissions