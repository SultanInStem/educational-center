const User = require('../../DB/models/User')
const Course = require('../../DB/models/Course')
const getUrl = require('../../helperFuncs/getUrl')
const { StatusCodes } = require('http-status-codes')
const getCourses = async (req, res, next) =>{
    const userId = req.userId 
    try{
        const user = await User.findById(userId)
        const profilePic = getUrl(user.profilePicture)
        const courses = await Course.find()
        const coursesArray = []
        for(let i = 0; i < courses.length; i++){
            const course = courses[i]
            if(course.coursePicture){
                const coursePicture = getUrl(course.coursePicture)
                course.coursePicture = coursePicture
            }
            if(user.completedCourses.includes(course._id)){
                course.isCompleted = true
            }else(
                course.isCompleted = false 
            )
            const obj = {
                courseId: course._id,
                coursePicture: course.coursePicture,
                name: course.name,
                minScore: course.minScore,
                isCompleted: course.isCompleted
            }
            coursesArray.push(obj)
        }
        const tempUser = {
            canComment: user.canComment, 
            profilePicture: profilePic,
            name : user.name,
            email: user.email,
            progressScore: user.progressScore
        }
        return res.status(StatusCodes.OK).json({courses: coursesArray, user: tempUser})
    }catch(err){
        return err
    }
}


module.exports = {
    getCourses
}