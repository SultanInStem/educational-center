const DefaultImage = require('../../../DB/models/DefaultImage')
const joi = require('joi')
const {BadRequest, NotFound} = require('../../../Error/ErrorSamples')
const deleteCloudFiles = require('../../../helperFuncs/deleteCloudFiles')
const { deleteLocalFiles } = require('../../../helperFuncs/deleteLocalFiles')
const genKey = require('../../../helperFuncs/genS3Key')
const isImage = require('../../../helperFuncs/isImage')
const uploadS3 = require('../../../helperFuncs/uploadFileS3')
const { StatusCodes } = require('http-status-codes')

async function verifyBody(body){
    const defaultRoles = ['profile', 'course', 'lesson']
    try{
        const joiSchema = joi.object({
            type: joi.string().valid(...defaultRoles).insensitive()
        })
        const {error, value} = joiSchema.validate(body)
        if(error) throw error
        value.type = value.type.toLowerCase() 
        return value 
    }catch(err){
        throw err
    }
}
const updateDefaultImage = async(req, res, next) => {
    try{
        const { type } = await verifyBody(req.body)  
        const file = req.file  
        if(!file) throw new BadRequest("File is missing")
        const isValidImage = isImage(file.filename)
        if(!isValidImage) throw new BadRequest("File is not a valid image")
        const defaultImage = await DefaultImage.findOne({role: type})
        if(!defaultImage) throw new NotFound("Default image with this type not found")
        const awsKey = genKey(16) + file.filename 
        file.awsKey = awsKey
        const response = await uploadS3(file)
        const deletedFile = await deleteCloudFiles(defaultImage.awsKey)
        const updatedImage = await DefaultImage.findOneAndUpdate({role: type}, {$set: {awsKey: awsKey}})
        return res.status(StatusCodes.OK).json({msg: `Default image for ${type} has been updated`})
    }catch(err){
        return next(err)
    }finally{
        await deleteLocalFiles()
    }
}

module.exports = updateDefaultImage