const Lesson = require('../../../DB/models/Lesson')
const changeTimeOut = async (req, res, next) =>{
    const lessonId = req?.params?.lessonId 
    try{
        if(!lessonId) throw new BadRequest("Lesson ID is missing")
        const {timeOutMinutes} = req.body
        if(!timeOutMinutes || timeOutMinutes === 0) throw new BadRequest("Time out cannot be set to zero!")
        const projection = {homeworkTimeOutMinutes: 1, }
        const lesson = await Lesson.findOneAndUpdate(
            {_id: lessonId},
            {homeworkTimeOutMinutes: timeOutMinutes},
            {new: true, projection})
        if(!lesson) throw new BadRequest(`Lesson with ID '${lessonId}' not found`)
        return res.status(StatusCodes.OK).json({msg: 'timeout has been updated', timeOut: lesson.homeworkTimeOutMinutes})
    }catch(err){
        return next(err)
    }
}
module.exports = changeTimeOut