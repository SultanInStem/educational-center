const {BadRequest, NotFound} = require('../../../Error/ErrorSamples')
const Lesson = require('../../../DB/models/Lesson')
const deleteCloudFiles = require('../../../helperFuncs/deleteCloudFiles')
const { StatusCodes } = require('http-status-codes')


const deleteAllFiles = async (req, res, next) =>{
    const {lessonId} = req.params 
    try{
        if(!lessonId) throw new BadRequest("Lesson ID must be provided")
        const lesson = await Lesson.findById(lessonId, {files: 1})
        if(!lesson) throw new NotFound(`Lesson with ID ${lessonId} not found`)
        const files = lesson.files
        for(const file of files){
            const response = await deleteCloudFiles(file?.awsKey)
        }
        await Lesson.findByIdAndUpdate(lessonId, {$pullAll: {files}})
        return res.status(StatusCodes.OK).json({msg: 'File have been deleted successfuly'})
    }catch(err){
        return next(err)
    }
}
module.exports = deleteAllFiles