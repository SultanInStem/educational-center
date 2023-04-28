const joi = require('joi')
const User = require('../../../DB/models/User')
const Lesson = require('../../../DB/models/Lesson')
const Course = require('../../../DB/models/Course')
const Homework = require('../../../DB/models/Hw')
const { NotFound, Forbidden, BadRequest } = require('../../../Error/ErrorSamples')
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
module.exports = checkHomework