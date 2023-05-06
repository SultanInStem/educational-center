const joi = require('joi')
const User = require('../../../DB/models/User')
const Lesson = require('../../../DB/models/Lesson')
const Course = require('../../../DB/models/Course')
const Homework = require('../../../DB/models/Hw')
const { NotFound, Forbidden, BadRequest } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')

const verifyHomework = async(data) => {
    try{
        const answers = joi.object({
            id: joi.string().min(6).required(),
            chosenAnswer: joi.string().required()
        })
        const answersSchema = joi.array().items(answers)
        const {error, value} = answersSchema.validate(data)
        if(error) throw error 
        return value 
    }catch(err){
        throw err
    }
}

async function completeLesson(user, lesson, course){
    const userId = user._id 
    const lessonId = lesson._id 
    try{
        if(user.completedCourseLessons.includes(lesson._id) || user.allCompletedLessons.includes(lesson._id)){
            throw new BadRequest("You already completed this lesson")
        }else if(user.completedCourses.includes(course._id) && !user.allCompletedLessons.includes(lessonId)){
            // if user completed the course, but there is a new lesson
            const updatedUser = await User.findByIdAndUpdate(userId, {$push: {allCompletedLessons: lessonId}}) 
            return { msg: "You completed this lesson!", updatedUser}
        }
        user.allCompletedLessons.push(lesson._id)
        user.completedCourseLessons.push(lesson._id)
        const currentScore = user.completedCourseLessons.length / course.lessons.length
        if(currentScore < 1){
            const update = {
                $set: {currentScore: currentScore},
                $push: {completedCourseLessons: lessonId, allCompletedLessons: lessonId}
            }
            const updatedUSer = await User.findByIdAndUpdate(userId, update, {new: true})
            return { msg: "Congrats, you completed the lesson!", updatedUSer }
        }else if(currentScore >= 1 && user.progressScore + 1 !== 6){
            const nextCourse = await Course.findOne({minScore: course.minScore + 1})
            const updatedUser = await User.findByIdAndUpdate(userId, 
                { 
                    $inc: { progressScore: 1 }, 
                    $set: { course: nextCourse.name, currentScore: 0, completedCourseLessons: [] },
                    $push: { completedCourses: course._id } 
                }, {new: true})
            return { msg: `Congrats, you completed the ${course.name} course!`, updatedUser }
        }else if(currentScore >= 1 && user.progressScore + 1 === 6){
            const updatedUser = await User.findByIdAndUpdate(userId, 
                {
                    $inc: { progressScore: 1 },
                    $push: { completedCourses: course._id }
                }, {new: true})
            return { msg: "Congrats, you completed the final course!", updatedUser }
        }
    }catch(err){
        throw err
    }
}

const calculateScore = (actualHomework, receivedHomework) => {
    try{
        let hwScore = 0 
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
            throw new BadRequest("Not Sufficient Score to complete the lesson")
        }
        return hwScore
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
        const receivedHomework = await verifyHomework(data)
        const lesson = await Lesson.findById(lessonId, { homework: 1, course: 1 })
        if(!lesson) throw new NotFound(`Lesson with Id ${lessonId} not found`)
        const user = await User.findById(userId, { completedCourseLessons: 1, completedCourses: 1, progressScore: 1, allCompletedLessons: 1 })
        const course = await Course.findOne({ name: lesson.course })
        if(!user) throw new NotFound("User Not Found")
        else if(!course) throw new NotFound("Course not found")

        if(receivedHomework.length < lesson.homework.length){
            throw new BadRequest("Some homework is missing")
        }else if(lesson.homework.length < 1){ // if there is no homework, just increment the score 
            const { msg, updatedUSer } = await completeLesson(user, lesson, course)
            return res.status(StatusCodes.OK).json({msg, updatedUSer, score: 100})
        }
        const actualHomework = await Homework.find({ lessonId })
        const score = calculateScore(actualHomework, receivedHomework)
        // what if user wants to complete a new lesson in the course they already completed?
        const { msg, updatedUser } = await completeLesson(user, lesson, course) 
        return res.status(StatusCodes.OK).json({msg, updatedUser, score})
    }catch(err){
        return next(err)
    }
}
module.exports = checkHomework