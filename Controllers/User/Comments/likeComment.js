const Comment = require('../../../DB/models/Comment')
const { NotFound, BadRequest} = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const likeComment = async (req, res, next) =>{
    const userId = req.userId 
    const {commentId, lessonId} = req.query
    console.log(req.query)
    try{
        if(!commentId) throw new BadRequest("Comment ID is missing")
        else if(!lessonId) throw new BadRequest("Lesson ID is missing")
        const comment = await Comment.findOne({_id: commentId, lessonId: lessonId}, {comment: 1})
        if(!comment) throw new NotFound(`Comment with id ${commentId} not found`)

        const update = {
            $addToSet: {likes: userId},
            $pull: {disLikes: userId},
            $set: {[`usersLiked.${userId}`]: userId},
            $unset: {[`usersDisliked.${userId}`]: 1}
        }
        const updatedComment = await Comment.findOneAndUpdate({lessonId, _id: commentId}, update, {new: true})
        return res.status(StatusCodes.OK).json({msg: 'u liked the comment', updatedComment})        
    }catch(err){
        return next(err)
    }
}

module.exports = likeComment