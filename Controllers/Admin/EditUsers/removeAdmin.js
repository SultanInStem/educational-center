const { StatusCodes } = require('http-status-codes')
const User = require('../../../DB/models/User')
const { BadRequest } = require('../../../Error/ErrorSamples')

const removeAdmin = async (req,res, next) => {
    try{
        const userId = req.params.id 
        if(!userId || userId.length < 10) throw new BadRequest("Please provide valid user Id")
        const user = await User.findById(userId, {isAdmin: 1})
        if(user.isAdmin == false) throw new BadRequest("User is not admin")
        await User.findByIdAndUpdate(userId, {$set: {isAdmin: false}}, {projection: {isAdmin: 1}, new: true})
        return res.status(StatusCodes.OK).json({msg: "You updated user"})
    }catch(err){
        return next(err)
    }
}
module.exports = removeAdmin