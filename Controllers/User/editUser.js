const mongoose = require('mongoose')
const {NotFound, BadRequest} = require('../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const { s3, CloudFront } = require('../../imports')
const User = require('../../DB/models/User')
const { HeadObjectCommand } = require('@aws-sdk/client-s3')

async function isImagePresent(imageKey){
    try{
        const headObjectCommand = new HeadObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: imageKey
        })
        const response = await s3.send(headObjectCommand)
        console.log(response)
        return true 
    }catch(err){
        return false
    }
}

const changeProfilePicture = async(req, res, next) =>{
    const userId = req.userId
    try{
        const {imageKey} = req.body 
        if(!imageKey) throw new BadRequest("image key is missing")
        // verify that image key is present in s3

        let isImageTrue = await isImagePresent(imageKey)
        if(!isImageTrue){
            throw new NotFound(`Image with the key ${imageKey} not found`)
        }
        // image exists, we can update mongo entry 
        const user = await User.findOneAndUpdate({_id: userId}, {profilePicture: imageKey}, {new: true})
        return res.status(StatusCodes.OK).json({msg: 'profile picture has been updated', user})
    }catch(err){
        return next(err);
    }
}

module.exports = {
    changeProfilePicture
}