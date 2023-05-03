const Course = require('../../../DB/models/Course')
const joi = require('joi')
const { BadRequest, NotFound } = require('../../../Error/ErrorSamples')
const { levelsArray } = require('../../../imports')
const uploadS3 = require('../../../helperFuncs/uploadFileS3')
const isImage = require('../../../helperFuncs/isImage')
const genKey = require('../../../helperFuncs/genS3Key')
const { StatusCodes } = require('http-status-codes')
const deleteCloudFiles = require('../../../helperFuncs/deleteCloudFiles')
const { deleteLocalFiles } = require('../../../helperFuncs/deleteLocalFiles')
async function verifyBody(body){
    try{
        const joiSchema = joi.object({
            course: joi.string().valid(...levelsArray).insensitive()
        })
        const {error, value} = joiSchema.validate(body)
        if(error) throw error 
        value.course = value.course.toUpperCase()
        return value 
    }catch(err){
        throw err
    }
}


const updateCoursePicture = async (req, res, next) =>{
    let aws_image_key = ''
    try{
        const file = req.file
        const { course } = await verifyBody(req.body)
        if(!file) throw new BadRequest('File is missing')
        const isValidImage = isImage(file)
        if(!isValidImage) throw new BadRequest("File provided is not a valid image")
        const awsKey = genKey(16) + file.filename 
        file.awsKey = awsKey
        aws_image_key = awsKey  
        const uploadedImage = await uploadS3(file)
        const courseobj = await Course.findOneAndUpdate(
            {name: course}, 
            {$set: {coursePicture: awsKey}}, 
            {new: true, projection: {lessons: 0}})
        if(!courseobj) throw new NotFound("Course not found")
        return res.status(StatusCodes.OK).json({msg: 'course image has been changed'})
    }catch(err){
        if(aws_image_key.length > 1){
            await deleteCloudFiles(aws_image_key)
        }
        return next(err)
    }finally{
        await deleteLocalFiles()
    }
}

module.exports = updateCoursePicture