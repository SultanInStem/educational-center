const Lesson = require('../../DB/models/Lesson')
const joi = require('joi')
const Homework = require('../../DB/models/Hw')
const {BadRequest, NotFound} = require('../../Error/ErrorSamples')
const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const { HeadObjectCommand } = require('@aws-sdk/client-s3')

function verifyInput(data){
    try{
        const validationSchema = joi.object({
            question: joi.string().min(1),
            options: joi.array().items(joi.string()).min(2),
            correctAnswer: joi.string().min(1),
            lessonId: joi.string().min(6)
        })
        const {error, value} = validationSchema.validate(data)
        if(error){
            throw error
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
        const data = verifyInput(req.body)
        if(!data) throw new BadRequest("Invalid input")
        const homework = new Homework({
            question: data.question,
            options: data.options,
            correctAnswer: data.correctAnswer,
            lessonId: data.lessonId
        })
        const uploadedHomework = await homework.save({session})
        const lesson = await Lesson.findByIdAndUpdate(data.lessonId, {
            $push: {homework: homework._id}
        }, {session})
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

const editHomework = async(req, res, next) => {
    const homeworkId = req.params.id 
    try{
        const data = verifyInput(req.body)
        if(!homeworkId) throw new BadRequest("Id of the object you are trying to update is missing")
        const homework = await Homework.findOneAndUpdate({lessonId: data.lessonId, _id: homeworkId}, {
            question: data.question,
            options: data.options,
            correctAnswer: data.correcrAnswer,
            lessonId: data.lessonId 
        }, {new: true})
        if(!homework) throw new BadRequest("Failed to update the homework")
        return res.status(StatusCodes.CREATED).json({msg: 'homework has been updated', homework})
    }catch(err){
        return next(err)
    }
}


const deleteHomework = async(req, res, next) => {
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



module.exports = {
    uploadHomework,
    deleteHomework,
    editHomework
} 