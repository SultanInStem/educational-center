const { StatusCodes } = require('http-status-codes')
const Course = require('../../../DB/models/Course')
const User = require('../../../DB/models/User')
const { NotFound, BadRequest } = require('../../../Error/ErrorSamples')
const getUrl = require('../../../helperFuncs/getUrl')
const getAllCourses = async(req, res, next) =>{
    const userId = req.userId 
    try{
        const courses = await Course.find({}, {lessons: 0}) 
        const user = await User.findById(userId, { name: 1, profilePicture: 1, progressScore: 1, email: 1, course: 1, completedCourses: 1})
        if(!user) throw new NotFound("User not found")
        const profileImageUrl = getUrl(user.profilePicture) // set up default url 
        user.profilePicture = profileImageUrl
        const modifiedCourses = [] 
        for(const item of courses){
            const course = {
                _id: item._id,
                name: item.name,
                coursePicture: getUrl(item.coursePicture), 
                minScore: item.minScore, 
                isCompleted: false
            }
            if(user.completedCourses.includes(course._id)){
                course.isCompleted = true
            }
            modifiedCourses.push(course)
        }
        return res.status(StatusCodes.OK).json({msg: 'Here u go', courses: modifiedCourses, user})
    }catch(err){
        return next(err)
    }
}
module.exports = getAllCourses