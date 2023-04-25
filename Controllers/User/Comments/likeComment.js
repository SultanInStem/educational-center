const Comment = require('../../../DB/models/Comment')
const likeComment = async (req, res, next) =>{
    const userId = req.userId 
    const {commentId, lessonId} = req.query
    console.log(req.query)
    try{
        if(!commentId) throw new BadRequest("Comment ID is missing")
        else if(!lessonId) throw new BadRequest("Lesson ID is missing")
        const comment = await Comment.findOne({_id: commentId, lessonId: lessonId})
        if(!comment) throw new NotFound(`Comment with id ${commentId} not found`)
        else if(comment.createdBy.equals(userId)){
            throw new BadRequest("Not allowed to like your own comments")
        }
        const update = {
            $addToSet: {likes: userId},
            $pull: {disLikes: userId}
        }
        const updatedComment = await Comment.findOneAndUpdate({lessonId, _id: commentId}, update, {new: true})
        return res.status(StatusCodes.OK).json({msg: 'u liked the comment', updatedComment})        
    }catch(err){
        return next(err)
    }
}

module.exports = likeComment