const { StatusCodes } = require('http-status-codes')
const Lesson = require('../../../DB/models/Lesson')
const Homework = require('../../../DB/models/Hw')
const { NotFound, BadRequest } = require('../../../Error/ErrorSamples')
const getUrl = require('../../../helperFuncs/getUrl')

const getLesson = async (req, res, next) => {
    const {lessonId, course} = req.query 
    try{
        if(!lessonId || !course) throw new BadRequest("Lesson ID and Course Name MUST be provided")
        const courseName = course.toUpperCase()
        const lesson = await Lesson.findOne({_id: lessonId, course: courseName}, {comments: 0})
        if(!lesson) throw new NotFound(`Lesson with ID ${lessonId} not found`)
        const homework = await Homework.find({lessonId: lesson._id})
        const tempLesson = {
            thumbNail: {
                Key: lesson.thumbNail,
                Url: getUrl(lesson.thumbNail)
            },
            videos: [],
            files: [],
            title: lesson.title,
            description: lesson.description,
            id: lesson._id,
            homework,
            homeWorkTimeOut: lesson.homeworkTimeOutMinutes,
        }
        for(const [key, value] of Object.entries(lesson.videos)){
            if(value){
                tempLesson.videos.push({lng: key, Url: getUrl(value), Key: value})
            }
        }
        for(let i = 0; i < lesson.files.length; i++){
            const file = lesson.files[i]
            if(file){
                tempLesson.files.push({Key: file.awsKey, name: file.name, Url: getUrl(file.awsKey)})
            }
        }
        return res.status(StatusCodes.OK).json({lesson: tempLesson})
    }catch(err){
        return next(err)
    }
}
module.exports = getLesson