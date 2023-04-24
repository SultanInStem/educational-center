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
        const homework = new Homework({
            question: question,
            options: options,
            correctAnswer: correctAnswer,
            lessonId: lessonId
        })
        const uploadedHomework = await homework.save({session})
        const projection = {
            propertyToExclude: 0, 
            comments: 0,
            description: 0,
            title: 0,
            files: 0,
            videos: 0,
            thumbNail: 0
        }
        const lesson = await Lesson.findByIdAndUpdate(lessonId, {
            $push: {homework: homework._id}
        }, {session, projection})
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


const verifyHomework = async(data) => {
    try{
        const answers = joi.object({
            id: joi.string().min(6),
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
        const lesson = await Lesson.findById(lessonId, {
            homework: 1,
            course: 1
        })
        if(!lesson) throw new NotFound(`Lesson with Id ${lessonId} not found`)
        const receivedHomework = await verifyHomework(data)
        if(receivedHomework.length !== lesson.homework.length){
            throw new BadRequest("Some homework is missing")
        }
        let hwScore = 0 
        const actualHomework = await Homework.find({lessonId})
        const hashMap = {}
        actualHomework.forEach(answer => {
            hashMap[answer._id] = answer.correctAnswer
        })
        receivedHomework.forEach(element =>{
            const chosenAnswer = element.chosenAnswer 
            const correctAnswer = hashMap[element.id]
            if(chosenAnswer === correctAnswer){
                hwScore++;
            }
        })
        hwScore = (hwScore / actualHomework.length) * 100 
        if(hwScore < 70){
            // think about msg 
            return res.status(StatusCodes.OK).json({msg: 'score is not sufficient to complete this lesson, try again please'})
        }
        const projection = {progressScore: 1, course: 1}
        const queryUser = {
            completedLessons: 1,
            completedCourses: 1,
            progressScore: 1
        }
        const user = await User.findById(userId, queryUser)
        if(!user) throw new NotFound("User Not Found")
        const course = await Course.findOne({name: lesson.course})
        if(!course) throw new NotFound("Course not found")
        if(user.completedLessons.includes(lesson._id) || user.completedCourses.includes(course._id)){
            // prevents user from submiting the same homework twice 
            return res.status(StatusCodes.OK).json({msg: 'you already completed this lesson ;)'})
        }
        user.completedLessons.push(lessonId) 
        const currentScore = user.completedLessons.length / course.lessons.length 
        if(currentScore < 1){
            const updatedUser = await User.findOneAndUpdate({_id: userId}, {
                currentScore: currentScore,
                $push: {completedLessons: lessonId}
            }, {new: true})
            return res.status(StatusCodes.OK).json({msg: 'you completed the lesson', updatedUser})
        }else if(currentScore >= 1 && user.progressScore + 1 !== 6){
            const nextCourse = await Course.findOne({minScore: user.progressScore + 1})
            if(!nextCourse) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({err: "Ooops, something went wrong"})
            const updatedUser = await User.findOneAndUpdate({_id: userId}, 
                {
                    progressScore: user.progressScore + 1,
                    course: nextCourse.name,
                    currentScore: 0,
                    completedLessons: [],
                    $push: {completedCourses: course._id}
                }, {new: true, projection})
            return res.status(StatusCodes.OK).json({msg: 'you completed the course!!!', updatedUser})
        }else if(currentScore >= 1 && user.progressScore + 1 === 6){
            // when user comeplted IELTS course 
            // there is no courses left, hence we handle this case differently
            const updatedUser = await User.findOneAndUpdate({_id: userId}, 
                { 
                    progressScore: 6, 
                    $push: {completedCourses: course._id}
                }, {new: true, projection})
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