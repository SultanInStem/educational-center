const { StatusCodes } = require('http-status-codes')
const Avatar = require('../../../DB/models/Avatar')
const getUrl = require('../../../helperFuncs/getUrl')

const getAvatars = async (req, res, next) => {
    try{
        const avatars = await Avatar.find()
        const modified = []
        for(const avatar of avatars){
            const temp = {
                url: getUrl(avatar.awsKey),
                imageKey: avatar.awsKey,
                id: avatar._id
            }
            modified.push(temp)
        }
        return res.status(StatusCodes.OK).json({avatars: modified})
    }catch(err){
        return next(err)
    }
}

module.exports = getAvatars