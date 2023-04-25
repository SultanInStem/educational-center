const Lesson = require('../../../DB/models/Lesson')
const Comment = require('../../../DB/models/Comment')
const User = require('../../../DB/models/User')
const getUrl = require('../../../helperFuncs/getUrl')
const getComments = async (req, res, next) =>{
    const lessonId = req.params?.lessonId
    try{
        if(!lessonId) throw new BadRequest("Lesson ID is missing")
        const lesson = await Lesson.findById(lessonId, {comments: 1})
        if(!lesson) throw new NotFound(`Lesson with Id ${lessonId} not found`)
        const comments = await Comment.find({lessonId: lessonId})
        const data = []
        const hashMap = {}
        // later limit the number of comments your are sending per request 
        // P.s use pagination
        for(let i = 0; i < comments.length; i++){ // significantly boosts performance 
            const commentObject = comments[i]
            const obj = {
                id: commentObject._id,
                comment: commentObject.comment,
                likes: commentObject.likes.length,
                dislikes: commentObject.disLikes.length
            }
            if(!hashMap[commentObject.createdBy]){
                const user = await User.findById(commentObject.createdBy)
                const signedUrl = getUrl(user.profilePicture)
                const tempUser = {
                    profilePicture: signedUrl,
                    email: user.email,
                }
                hashMap[user._id] = tempUser
                obj.profilePicture = signedUrl 
                obj.email = user.email 
                data.push(obj)
            }else if(hashMap[commentObject.createdBy]){
                const user = hashMap[commentObject.createdBy]
                obj.profilPicture = user.profilePicture 
                obj.email = user.email 
                data.push(obj)
            }
        }
        return res.status(StatusCodes.OK).json({comments: data})
    }catch(err){
        return next(err)
    }
}

module.exports = getComments