const Avatar = require('../../../DB/models/Avatar')
const genKey = require('../../../helperFuncs/genS3Key')
const path = require('path')
const fs = require('fs')
const { BadRequest } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const {deleteLocalFiles} = require('../../../helperFuncs/deleteLocalFiles')
const uploadS3 = require('../../../helperFuncs/uploadFileS3')
const isImage = require('../../../helperFuncs/isImage')
const uploadsPath = path.join(__dirname, '..', '..', '..', 'uploads')

const uploadAvatar = async (req, res, next) =>{
    try{
        const numberOfAvatars = await Avatar.countDocuments({})
        if(numberOfAvatars >= 16) throw new BadRequest("Can't upload more than 16 avatars, please delete or replace some")
        const file = req.file 
        if(!file) throw new BadRequest("File is missing")
        const isValidImage = isImage(file.filename)
        if(!isValidImage) throw new BadRequest("Image is not valid")
        const awsKey = genKey(16) + file.filename 
        file.awsKey = awsKey
        const responseS3 = await uploadS3(file)
        const avatar = await Avatar.create({awsKey: file.awsKey}) 
        console.log(responseS3)
        console.log(avatar)
        return res.status(StatusCodes.OK).json({msg: 'Image has been uploaded!'})
    }catch(err){
        return next(err)
    }finally{
        await deleteLocalFiles(uploadsPath)
    }
}

module.exports = uploadAvatar