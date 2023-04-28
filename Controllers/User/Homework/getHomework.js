const Homework = require('../../../DB/models/Hw')
const Lesson = require('../../../DB/models/Lesson')
const { NotFound, Forbidden, BadRequest } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const getHomework = async(req, res, next) =>{
    const lessonId = req?.params?.lessonId
    try{
        if(!lessonId) throw new BadRequest("Lesson ID is missing")
        const lesson = await Lesson.findOne({_id: lessonId}, 
            {
                homework: 1,
                homeworkTimeOutMinutes: 1,
                course: 1,
            })
        console.log(lesson)
        if(!lesson) throw new NotFound(`Lesson with ID '${lessonId}' does not exist`)
        const homeworkArray = lesson.homework 
        if(homeworkArray.length < 1) return res.status(StatusCodes.OK).json({homework: []})
        const homework = await Homework.find({lessonId})
        return res.status(StatusCodes.OK).json({homework, timeOut: lesson.homeworkTimeOutMinutes})
    }catch(err){
        return next(err)
    }
}
module.exports = getHomework