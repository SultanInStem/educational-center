const User = require('../../../DB/models/User')
const Comment = require('../../../DB/models/Comment')
const Lesson = require('../../../DB/models/Lesson')
const { NotFound, Forbidden, BadRequest } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const deleteComment = async(req, res, next) => {
    const userId = req.userId
    const commentId = req.params?.commentId 
    try{
        if(!commentId) throw new BadRequest("Comment Id is missing")
        const comment = await Comment.findById(commentId)
        if(!comment) throw new NotFound(`Comment with ID ${commentId} not found`)
        const user = await User.findById(userId)
        if(!userId) throw new Forbidden("Not allowed to delete this comment")
        if(comment.createdBy.equals(user._id) === false && user.isAdmin === false){
            // checks if user is the creator of the comment or the admin
            throw new Forbidden('You are not allowed to delete comments of other users')
        }
        const deletedComment = await Comment.findOneAndDelete({_id: commentId})
        const lessonId = comment.lessonId 
        const lesson = await Lesson.findOneAndUpdate({_id: lessonId}, {$pull: {comments: comment._id}}, {new: true})
        return res.status(StatusCodes.OK).json(
        {
            msg: 'comment has been deleted successfuly',
            comments: lesson.comments,
            deletedComment
        })
    }catch(err){
        return next(err)
    }
}
module.exports = deleteComment