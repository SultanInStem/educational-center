const User = require('../../../DB/models/User')
const Lesson = require('../../../DB/models/Lesson')
const Comment = require('../../../DB/models/Comment')
const isAllowedToComment = (user, course) => {
    try{
        if(!course){
            throw NotFound("Course not found. Couldn't verify permissions")
        }else if(user.progressScore < course.minScore){
            throw new Forbidden("Not allowed to modify this resource")
        }else if(user?.canComment === false){
            throw new Forbidden("You are banned from adding comments")
        }else if(!user){
            throw new NotFound("User is missing. Failed to verify permissions")
        }
        return true
    }catch(err){
        throw err
    }
}
const createComment = async(req, res, next) =>{
    const userId = req.userId
    const lessonId = req.params?.lessonId
    const {commentText} = req.body 
    const session = await mongoose.startSession()
    session.startTransaction()
    let abortTransaction = false
    try{
        if(!lessonId) throw new BadRequest("Invalid request")
        else if(!commentText) throw new BadRequest("Cannot add empty comment")
        else if(commentText.length > 60) throw new BadRequest("Maximum length of the comment is 60")
        const user = await User.findById(userId, {canComment: 1, progressScore: 1})
        if(!user) throw new Forbidden("You are not allowed to add comments")
        const comment = new Comment({comment: commentText, createdBy: userId, lessonId: lessonId})
        const lesson = await Lesson.findOneAndUpdate(
            {_id: lessonId}, 
            {$push: {comments: comment._id}}, 
            {session, projection: {course: 1}}
        )
        const course = await Course.findOne({name: lesson.course}, {name: 1, minScore: 1})
        isAllowedToComment(user, course)
        await comment.save({session})
        if(!lesson){
            throw new NotFound("Failed to add lesson")
        }else if(!course){
            throw new NotFound("Failed to verify permissions. Course not found")
        }
        await session.commitTransaction()
        // think about sending more comments 
        return res.status(StatusCodes.CREATED).json({msg: "Comment has been added successfuly", comment: commentText, commentId: comment._id})
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
module.exports = createComment