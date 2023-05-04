const Homework = require('../../../DB/models/Hw')
const { StatusCodes } = require('http-status-codes')
const { BadRequest } = require('../../../Error/ErrorSamples')
const { verifyHomeworkBody } = require('./uploadHomework')
const editQuestion = async(req, res, next) => {
    const homeworkId = req.params?.id 
    try{
        const {question, options, correctAnswer, lessonId} = await verifyHomeworkBody(req.body)
        if(!homeworkId) throw new BadRequest("Id of the object you are trying to update is missing")
        const homework = await Homework.findOneAndUpdate({lessonId, _id: homeworkId}, {
            $set: {question, options, correctAnswer}
        }, {new: true})
        if(!homework) throw new BadRequest("Failed to update the homework")
        return res.status(StatusCodes.CREATED).json({msg: 'homework has been updated', homework})
    }catch(err){
        return next(err)
    }
}

module.exports = editQuestion