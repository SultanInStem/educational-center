const Lesson = require('../../DB/models/Lesson')
const joi = require('joi')
const Homework = require('../../DB/models/Hw')
const {BadRequest, NotFound} = require('../../Error/ErrorSamples')
const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const User = require('../../DB/models/User')
const Level = require('../../DB/models/Level')
function verifyInput(data){
    try{
        const validationSchema = joi.object({
            question: joi.string().min(1),
            options: joi.array().items(joi.string()).min(2),
            correctAnswer: joi.string().min(1),
            lessonId: joi.string().min(6),
            homeworkTimeOutMinutes: joi.number().optional()
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

const getHomework = async(req, res, next) =>{
    const lessonId = req?.params?.lessonId
    try{
        if(!lessonId) throw new BadRequest("Lesson ID is missing")
        const lesson = await Lesson.findOne({_id: lessonId})
        if(!lesson) throw new NotFound(`Lesson with ID '${lessonId}' does not exist`)
        const homeworkArray = lesson.homework 
        if(homeworkArray.length < 1) return res.status(StatusCodes.OK).json({homework: []})
        const homework = await Homework.find({lessonId})
        return res.status(StatusCodes.OK).json({homework})
    }catch(err){
        return next(err)
    }
}
const changeTimeOut = async (req, res, next) =>{
    const lessonId = req?.params?.lessonId 
    try{
        if(!lessonId) throw new BadRequest("Lesson ID is missing")
        const {timeOutMinutes} = req.body
        if(!timeOutMinutes || timeOutMinutes === 0) throw new BadRequest("Time out cannot be set to zero!")
        const lesson = await Lesson.findOneAndUpdate({_id: lessonId}, {homeworkTimeOutMinutes: timeOutMinutes}, {new: true})
        if(!lesson) throw new BadRequest(`Lesson with ID '${lessonId}' not found`)
        return res.status(StatusCodes.OK).json({msg: 'timeout has been updated'})
    }catch(err){
        return next(err)
    }
}


const verifyHomework = async(data) => {
    try{
        const answers = joi.object({
            correctAnswer: joi.string().min(1),
            chosenAnswer: joi.string().min(1)
        })
        const answersSchema = joi.array().items(answers)
        const {error, value} = answersSchema.validate(data)
        if(error) throw error 
        return value 
    }catch(err){
        throw err
    }
}
const checkHomework = async(req, res, next) =>{
    const userId = req.userId 
    const lessonId = req?.params?.lessonId
    const session = await mongoose.startSession()
    session.startTransaction()
    try{
        const {answers, level} = req.body
        if(!answers || answers.length < 1) throw BadRequest("No homework was provided to check")
        if(!lessonId) throw new BadRequest("Lesso ID is missing")
        const data = await verifyHomework(answers) 
        
        let score = 0
        for(const item of data){
            if(item.correctAnswer === item.chosenAnswer){
                score += 1
            }
        }
        score = (score / data.length) * 100 
        if(score < 70) {
            const msg = `Please take the test again. You scored ${score} percent although the minimum of 70 percent is required`
            return res.status(StatusCodes.OK).json({msg})
        }
        // check if the homework was uploaded for the last lesson 
        const user = await User.findById(userId)
        const lesson = await Lesson.findOne({_id: lessonId, level: level.toUpperCase()}) 
        if(!lesson) throw new NotFound("Lesson Not Found")
        const course = await Level.findOne({level: lesson.level})
        user.completedLessons.push(lesson._id)
        if(user.completedLessons.length === course.lessons.length){
            user.progressScore = course.minScore + 1
            user.completedLevels.push(course._id) 
            const nextCourse = await Level.findOne({minScore: user.progressScore})
            user.level = nextCourse.level
            await user.save()
            return res.status(StatusCodes.OK).json({msg: "congrats on completing the course"})
        }
        user.progressScore = user.completedLessons.length / course.lessons.length 
        return res.status(StatusCodes.OK).json({msg: "well-done"}) 
    }catch(err){
        return next(err)
    }
}
module.exports = {
    uploadHomework,
    deleteHomework,
    editHomework,
    getHomework,
    checkHomework, 
    changeTimeOut
} 