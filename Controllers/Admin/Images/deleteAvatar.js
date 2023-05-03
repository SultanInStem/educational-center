const Avatar = require('../../../DB/models/Avatar')
const deleteCloudFiles = require('../../../helperFuncs/deleteCloudFiles')
const { BadRequest } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')

const deleteAvatar = async(req, res, next) => {
    const { imageId } = req.params
    try{
        if(imageId.length < 10) throw new BadRequest("Provide valid image ID")
        const deletedImage = await Avatar.findByIdAndDelete(imageId)
        const deletedImageS3 = await deleteCloudFiles(deletedImage.awsKey)
        return res.status(StatusCodes.OK).json({msg: 'Image has been deleted'})
    }catch(err){
        return next(err)
    }
}
module.exports = deleteAvatar   