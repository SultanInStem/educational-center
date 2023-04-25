const mongoose = require('mongoose')
const Homework = require('../../../DB/models/Hw')
const Lesson = require('../../../DB/models/Lesson')

const deleteQuestion = async(req, res, next) => {
    const homeworkId = req.params.id 
    const session = await mongoose.startSession()
    session.startTransaction()
    let abortTransaction = false 
    try{
        // we don't need to provide lessonID since the speed of deletion does not really matter 
        if(!homeworkId) throw new BadRequest("Id of the object you are trying to delete is missing")
        const homework = await Homework.findOneAndDelete({_id: homeworkId}, {session}).lean()
        if(!homework) {
            abortTransaction = true 
            throw new NotFound("Homework you are trying to delete is not found")
        }
        const lessonId = homework.lessonId 
        const lesson = await Lesson.findOneAndUpdate({_id: lessonId}, {
            $pull: {homework: homework._id}
        }, {new: true, session})
        if(!lesson){
            abortTransaction = true 
            throw new BadRequest("Failed to delete homework")
        }
        await session.commitTransaction()
        return res.status(StatusCodes.OK).json({msg: 'homework has been deleted successfuly', homework})
    }catch(err){
        abortTransaction = true 
        return next(err)
    }finally{
        if(abortTransaction){
            await session.abortTransaction()
        }
        await session.endSession()
    }
}
module.exports = deleteQuestion