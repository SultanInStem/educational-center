const User = require('../DB/models/User')
const Course = require('../DB/models/Course')
const { NotFound, Forbidden } = require('../Error/ErrorSamples')
async function verifyUserProgress(userId, courseName){
    try{
        const user = await User.findById(userId, {
            profilePicture: 1,
            progressScore: 1,
            allCompletedLessons: 1,
            completedCourseLessons: 1,
            completedCourses: 1,
            currentScore: 1,
            isAdmin: 1,
            course: 1,
            canComment: 1
        })
        if(!user) throw new NotFound("User not Found")
        const course = await Course.findOne({name: courseName})
        if(!course) throw new NotFound("Course not Found")
        
        if(user.progressScore < course.minScore){
            throw new Forbidden("Not ALlowed to Access This Course Yet")
        }else if(user.progressScore >= course.minScore){
            return {user, course}
        }
    }catch(err){
        throw err
    }
}
module.exports = { verifyUserProgress }