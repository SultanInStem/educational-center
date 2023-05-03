const deleteCloudFiles = require('../../../helperFuncs/deleteCloudFiles')
const { NotFound, BadRequest} = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const Lesson = require('../../../DB/models/Lesson')

const deleteFile = async(req, res, next) =>{
    const {fileId, lessonId} = req.query
    try{
        if(!fileId || !lessonId) throw new BadRequest("File id and Lesson Id must be provided") 
        const lesson = await Lesson.findById(lessonId, {files: 1})
        if(!lesson) throw new NotFound(`Lesson with ID ${lessonId} not found`)
        const files = lesson.files 
        for(const file of files){
            if(file.awsKey === fileId){
                const response = await deleteCloudFiles(fileId)
                console.log(response)
                break;
            }
        }
        await Lesson.findByIdAndUpdate(lessonId, {$pull: {files: {awsKey: fileId}}})
        return res.status(StatusCodes.OK).json({msg: "File has been deleted"})
    }catch(err){
        return next(err)
    }   
}

module.exports = deleteFile