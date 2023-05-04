const { NotFound, BadRequest } = require('../../../Error/ErrorSamples')
const Lesson = require('../../../DB/models/Lesson')
const Homework = require('../../../DB/models/Hw')
const { StatusCodes } = require('http-status-codes')

const deleteAllQuestions = async (req, res, next) =>{
    const { lessonId } = req.params
    console.log(lessonId)
    try{
        if(!lessonId || lessonId.length < 10) throw new BadRequest("Provide valid lesson ID in the parameter")
        const lesson = await Lesson.findByIdAndUpdate(lessonId, {$set: {homework: []}})
        if(!lesson) throw new NotFound(`Lesson with ID ${lessonId} not found`)
        const deletedHomework = await Homework.deleteMany({lessonId})
        return res.status(StatusCodes.OK).json({msg: 'All homework has been deleted'})
    }catch(err){
        return next(err)
    }
}

module.exports = deleteAllQuestions