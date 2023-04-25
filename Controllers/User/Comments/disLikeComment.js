const Comment = require('../../../DB/models/Comment') 
const disLikeComment = async(req, res, next) =>{
    const userId = req.userId  
    const {commentId, lessonId} = req.query 
    try{
        if(!commentId) throw new BadRequest("Comment ID is missing")
        else if(!lessonId) throw new BadRequest("Lesson ID is missing")
        const comment = await Comment.findOne({_id: commentId, lessonId: lessonId})
        if(!comment) throw new NotFound(`Comment with ID ${commentId} not found`)
        else if(comment.createdBy.equals(userId)) throw new BadRequest("Not allowed to dislike your own comments")
        const update = {
            $addToSet: {disLikes: userId},
            $pull: {likes: userId}
        }
        const updatedComment = await Comment.findOneAndUpdate({lessonId, _id: commentId}, update, {new: true})
        return res.status(StatusCodes.OK).json({msg: 'You disliked the comment', updatedComment})
    }catch(err){
        return next(err)
    }
}
module.exports = disLikeComment