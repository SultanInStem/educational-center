const { StatusCodes } = require('http-status-codes')
const User = require('../../../DB/models/User')
const { BadRequest, NotFound } = require('../../../Error/ErrorSamples')
const makeAdmin = async (req,res, next) => {
    try{
        const userId = req.params.id 
        if(!userId || userId.length < 10) throw new BadRequest("Please provide valid user id")
        const user = await User.findByIdAndUpdate(userId, {$set: {isAdmin: true}}, {new: true, projection: {isAdmin: 1}})
        if(!user) throw new NotFound("User with this id does not exist")
        return res.status(StatusCodes.OK).json({msg: "You updated user to admin"})
    }catch(err){
        return next(err)
    }
}
module.exports = makeAdmin