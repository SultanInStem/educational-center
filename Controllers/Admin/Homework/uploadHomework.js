const mongoose = require('mongoose')
const Lesson = require('../../../DB/models/Lesson')
const Homework = require('../../../DB/models/Hw')
const joi = require('joi')
const { NotFound, BadRequest } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
function verifyHomeworkBody(data){
    try{
        const validationSchema = joi.object({
            question: joi.string().required(),
            correctAnswer: joi.string().required(),
            options: joi.array().items(joi.string()).required().min(2),
            lessonId: joi.string().min(10)
        })
        const {error, value} = validationSchema.validate(data)
        if(error){
            throw error
        }else if(!value.options.includes(value.correctAnswer)){
            throw new BadRequest("Options must include correct answer")
        }
        return value 
    }catch(err){
        throw err
    }
}

const uploadHomework = async(req, res, next) =>{ 
    let abortTransaction = false 
    const session = await mongoose.startSession()
    session.startTransaction()
    try{
        const {question, options, lessonId, correctAnswer} = await verifyHomeworkBody(req.body)
        const homework = new Homework({
            question: question,
            options: options,
            correctAnswer: correctAnswer,
            lessonId: lessonId
        })
        const uploadedHomework = await homework.save({session})
        const lesson = await Lesson.findByIdAndUpdate(lessonId, {
            $push: {homework: homework._id}
        }, {session, projection: {homework: 1}})
        console.log(lesson)
        if(!lesson) {
            abortTransaction = true
            throw new NotFound(`Lesson with ID '${data.lessonId}' not found`)
        }
        if(!uploadedHomework || !lesson){
            abortTransaction = true 
            throw new BadRequest("Failed to upload the homework")
        }
        await session.commitTransaction()
        return res.status(StatusCodes.CREATED).json({msg: 'Homework has been uploaded'})
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
module.exports = {uploadHomework, verifyHomeworkBody}