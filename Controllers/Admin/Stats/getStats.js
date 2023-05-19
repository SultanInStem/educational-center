const { StatusCodes } = require('http-status-codes')
const Lesson = require('../../../DB/models/Lesson')
const User = require('../../../DB/models/User')
const {NotFound} = require('../../../Error/ErrorSamples')
const getUrl = require('../../../helperFuncs/getUrl')
const getStats = async (req, res, next) =>{
    const userId = req.userId 
    try{
        const admin = await User.findById(userId, {profilePicture: 1, name: 1})
        if(!admin) throw new NotFound("Admin not found")
        const users = await User.find({}, {lastActive: 1, gender: 1, age: 1, isActive: 1})
        const lessons = await Lesson.find({}, {comments: 0, videos: 0, files: 0})
        let activeUsers = 0 
        let maleUsers = 0 
        let femaleUsers = 0
        for(const user of users){
            if(user.isActive === true){
                activeUsers += 1 
            }
            if(user.gender === 'M'){
                maleUsers += 1 
            }
            if(user.gender === 'F'){
                femaleUsers += 1
            }
        }
        const ageGroups = await User.aggregate([
            {
                $group: {
                  _id: "$age",
                  count: { $sum: 1 }
                }
            }
        ])

        console.log(ageGroups)
        admin.profilePicture = getUrl(admin.profilePicture)
        return res.status(StatusCodes.OK).json({
            lessons: lessons.length,
            totalUsers: users.length,
            maleUsers,
            femaleUsers,
            activeUsers,
            courses: 6,
            admin,
            ageGroups
        })
    }catch(err){
        return next(err)
    }
}

module.exports = getStats