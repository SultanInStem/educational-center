const { StatusCodes } = require('http-status-codes')
const User = require('../../../DB/models/User')
const getUrl = require('../../../helperFuncs/getUrl')
const searchUser = async(req, res, next) =>{
    const { q } = req.query
    try{
        const users = await User.find({$or: [
            {name: {$regex: q}},
            {email: {$regex: q}},
            {gender: {$regex: q}},
            {course: {$regex: q}}
        ]}, {name: 1, email: 1, gender: 1, course: 1, profilePicture: 1})
        for(const user of users){
            if(user.profilePicture){
                user.profilePicture = getUrl(user.profilePicture)
            }
        }
        return res.status(StatusCodes.OK).json({users})
    }catch(err){
        return next(err)
    }
}

module.exports = searchUser