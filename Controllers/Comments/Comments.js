const { BadRequest, NotFound, Unauthorized, Forbidden } = require('../../Error/ErrorSamples')
const { getSignedUrl } = require('@aws-sdk/cloudfront-signer')
const { StatusCodes } = require('http-status-codes')
const Comment = require('../../DB/models/Comment')
const Lesson = require('../../DB/models/Lesson')
const Course = require('../../DB/models/Course')
const User = require('../../DB/models/User')
const mongoose = require('mongoose')


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

function getUrl(key){
    const signedUrl = getSignedUrl({
        keyPairId: process.env.AWS_CLOUD_KEY_PAIR_ID,
        privateKey: process.env.PRIVATE_KEY,
        url: process.env.AWS_CLOUD_DOMAIN + `/${key}`,
        dateLessThan: new Date(Date.now() + 1000 * 60 * 60 * 48)
    })
    return signedUrl
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


const deleteAllComments = async (req, res, next) =>{
    const {lessonId} = req.params 
    try{
        if(!lessonId) throw new BadRequest("Lesson ID is missing")
        const lesson = await Lesson.findById(lessonId)
        if(!lesson) throw new NotFound(`Lesson with id ${lessonId} not found`)
        const comments = await Comment.deleteMany({lessonId: lessonId})
        await Lesson.findOneAndUpdate({_id: lessonId}, {comments: []})
        return res.status(StatusCodes.OK).json({msg: 'all comments have been deleted', deletedComments: comments})
    }catch(err){
        return next(err)
    }
}
module.exports = {
    createComment,
    deleteComment,
    likeComment,
    disLikeComment,
    getComments,
    deleteAllComments
}