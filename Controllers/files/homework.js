const joi = require('joi')
const Homework = require('../../DB/models/Hw')
const { BadRequest, NotFound } = require('../../Error/ErrorSamples')
const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const User = require('../../DB/models/User')
const Course = require('../../DB/models/Course')
const Lesson = require('../../DB/models/Lesson')

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
        const {question, options, lessonId, correctAnswer} = await verifyInput(req.body)
        if(!data) throw new BadRequest("Invalid input")
        const homework = new Homework({
            question: question,
            options: options,
            correctAnswer: correctAnswer,
            lessonId: lessonId
        })
        const uploadedHomework = await homework.save({session})
        const lesson = await Lesson.findByIdAndUpdate(lessonId, {
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
        return res.status(StatusCodes.OK).json({homework, timeOut: lesson.homeworkTimeOutMinutes})
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
    const lessonId = req?.params?.lessonId
    const userId = req.userId 
    const data = req.body?.homework
    try{
        if(!lessonId) throw new BadRequest("Lesson ID is necessary for the request")
        const lesson = await Lesson.findById(lessonId)
        if(!lesson) throw new NotFound(`Lesson with Id ${lessonId} not found`)
        const homeworkArr = await verifyHomework(data)
        let hwScore = 0 
        for(let i = 0; i < homeworkArr.length; i++){
            const chosenAnswer = homeworkArr[i].chosenAnswer 
            const correctAnswer = homeworkArr[i].correctAnswer 
            homeworkArr[i].chosenAnswer = chosenAnswer.replace(/[.\s]/g, '').toLowerCase()
            homeworkArr[i].correctAnswer = correctAnswer.replace(/[.\s]/g, '').toLowerCase()
            if(homeworkArr[i].chosenAnswer === homeworkArr[i].correctAnswer){
                hwScore += 1
            }
        }
        hwScore = (hwScore / homeworkArr.length) * 100 
        console.log('Score', hwScore)
        if(hwScore < 70){
            // think about msg 
            return res.status(StatusCodes.OK).json({msg: 'score is not sufficient to complete this lesson, try again please'})
        }
        const user = await User.findById(userId)
        const course = await Course.findOne({name: lesson.course})
        if(!course) throw new NotFound("Course not found")
        if(user.completedLessons.includes(lesson._id) || user.completedCourses.includes(course._id)){
            // prevents user from submiting the same homework twice 
            return res.status(StatusCodes.OK).json({msg: 'you already completed this lesson ;)'})
        }

        // handle exceptions later on here 
        user.completedLessons.push(lessonId) 

        const currentScore = user.completedLessons.length / course.lessons.length 

        if(currentScore < 1){
            const updatedUser = await User.findOneAndUpdate({_id: userId}, {
                currentScore: currentScore,
                $push: {completedLessons: lessonId}
            })
            return res.status(StatusCodes.OK).json({msg: 'you completed the lesson', updatedUser})
        }else if(currentScore >= 1 && user.progressScore + 1 !== 6){
            // when user completes any course RATHER THAN ielts 
            const nextCourse = await Course.findOne({minScore: user.progressScore + 1})
            if(!nextCourse) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: "Ooops, something went wrong"})
            const updatedUser = await User.findOneAndUpdate({_id: userId}, 
                {
                    progressScore: user.progressScore + 1,
                    course: nextCourse.name,
                    currentScore: 0,
                    completedLessons: [],
                    $push: {completedCourses: course._id}
                }, {new: true})
            return res.status(StatusCodes.OK).json({msg: 'you completed the course!!!', updatedUser})
        }else if(currentScore >= 1 && user.progressScore + 1 === 6){
            const updatedUser = await User.findOneAndUpdate({_id: userId}, 
                { 
                    progressScore: 6, 
                    $push: {completedCourses: course._id}
                }, {new: true})
            return res.status(StatusCodes.OK).json({msg: "You have completed final course congrats!!!", updatedUser})
        }
        return res.status(StatusCodes.OK).json({msg: 'oki'})
    }catch(err){
        console.log(err)
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