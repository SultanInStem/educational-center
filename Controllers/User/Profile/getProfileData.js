const { StatusCodes } = require('http-status-codes')
const Avatar = require('../../../DB/models/Avatar')
const User = require('../../../DB/models/User') 
const getUrl = require('../../../helperFuncs/getUrl')
const DefaultImage = require('../../../DB/models/DefaultImage')

const getProfile = async (req, res, next) => {
    const userId = req.userId
    try{
        const user = await User.findById(userId, {profilePicture: 1, name: 1, email: 1, course: 1, currentScore: 1})
        const avatars = await Avatar.find({})
        const modifiedAvatars = []
        const defaultProfileImage = await DefaultImage.findOne({role: 'profile'})
        avatars.push(defaultProfileImage)
        user.profilePicture = getUrl(user.profilePicture)
        for(const avatar of avatars){
            const item = {
                awsKey: avatar.awsKey,
                url: getUrl(avatar.awsKey),
                id: avatar._id
            }
            modifiedAvatars.push(item)
        }
        return res.status(StatusCodes.OK).json({user, avatars: modifiedAvatars})
    }catch(err){
        return next(err)
    }
}

module.exports = getProfile