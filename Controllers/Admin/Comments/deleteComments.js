const Lesson = require('../../../DB/models/Lesson')
const Comment = require('../../../DB/models/Comment')
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

module.exports = deleteAllComments