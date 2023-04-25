const Homework = require('../../../DB/models/Hw')

const editQuestion = async(req, res, next) => {
    const homeworkId = req.params?.id 
    try{
        const {question, options, correcrAnswer, lessonId} = await verifyInput(req.body)
        if(!homeworkId) throw new BadRequest("Id of the object you are trying to update is missing")
        const homework = await Homework.findOneAndUpdate({lessonId, _id: homeworkId}, {
            question: question,
            options: options,
            correctAnswer: correcrAnswer,
            lessonId: lessonId 
        }, {new: true})
        if(!homework) throw new BadRequest("Failed to update the homework")
        return res.status(StatusCodes.CREATED).json({msg: 'homework has been updated', homework})
    }catch(err){
        return next(err)
    }
}

module.exports = editQuestion