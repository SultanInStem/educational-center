const deleteCloudFiles = require('../../../helperFuncs/deleteCloudFiles')
const uploadS3 = require('../../../helperFuncs/uploadFileS3')
const { NotFound, BadRequest } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const Lesson = require('../../../DB/models/Lesson')
const { deleteLocalFiles } = require('../../../helperFuncs/deleteLocalFiles')
const joi = require('joi')
const path = require('path')
const genKey = require('../../../helperFuncs/genS3Key')
const fs = require('fs')
const { supportedFileExtensions } = require('../../../imports')
const folderPath = path.join(__dirname, '..', '..', '..', 'uploads')

async function verifyBody(body){
    try{
        const joiSchema = joi.object({
            lessonId: joi.string().min(6).required()
        })
        const {error, value} = joiSchema.validate(body)
        if(error) throw error
        return value
    }catch(err){
        throw err
    }
}

async function validateInputs(folderPath){
    try{
        const files = new Promise((resolve, reject) =>{
            fs.readdir(folderPath, (err, files) =>{
                files.forEach(item => {
                    const extension = item.substring(item.lastIndexOf('.')).toLowerCase() 
                    if(!supportedFileExtensions.includes(extension)){
                        reject(new BadRequest(`The extension ${extension} is not supported!`))
                    }
                })
                resolve(files)
            })
        })
        return files 
    }catch(err){
        throw err 
    }
}
const uploadLessonFiles = async (req, res, next)=>{
    const modifiedFiles = []
    try{
        const { lessonId } = await verifyBody(req.body)
        await validateInputs(folderPath)
        const lesson = await Lesson.findById(lessonId, {files: 1})
        if(!lesson) throw new NotFound('Lesson Not Found') 
        const files = req.files 
        if(files.length < 1) throw new BadRequest('No Files to Upload') 
        for(const item of files){
            const awsKey = genKey(16) + item.filename 
            item.awsKey = awsKey
            modifiedFiles.push(item)
            const file = {
                name: item.originalname,
                awsKey: awsKey
            }
            lesson.files.push(file)
            const response = await uploadS3(item, "attachment")
        }
        const updatedLesson = await Lesson.findOneAndUpdate(
            {_id: lessonId},
            {$set: {files: lesson.files}},
            {projection: {files: 1}, new: true}
        )
        if(!updatedLesson) throw new BadRequest('Failed to updated the lesson')
        return res.status(StatusCodes.CREATED).json({msg: 'Files have been uploaded', success: true})
    }catch(err){
        for(const item of modifiedFiles){
            await deleteCloudFiles(item.awsKey)
        }
        return next(err)
    }finally{
        await deleteLocalFiles(folderPath) 
    }
}

module.exports = uploadLessonFiles