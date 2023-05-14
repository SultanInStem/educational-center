const Comment = require('../../../DB/models/Comment') 
const { BadRequest, NotFound } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const disLikeComment = async(req, res, next) =>{
    const userId = req.userId  
    const {commentId, lessonId} = req.query 
    try{
        if(!commentId) throw new BadRequest("Comment ID is missing")
        else if(!lessonId) throw new BadRequest("Lesson ID is missing")
        const comment = await Comment.findOne({_id: commentId, lessonId: lessonId})
        if(!comment) throw new NotFound(`Comment with ID ${commentId} not found`)

        const update = {
            $addToSet: {disLikes: userId},
            $pull: {likes: userId},
            $set: {[`usersDisliked.${userId}`]: userId},
            $unset: {[`usersLiked.${userId}`]: userId}
        }
        const updatedComment = await Comment.findOneAndUpdate({lessonId, _id: commentId}, update, {new: true})
        return res.status(StatusCodes.OK).json({msg: 'You disliked the comment', updatedComment})
    }catch(err){
        return next(err)
    }
}
module.exports = disLikeComment