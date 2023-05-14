const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
    comment: {
        type: String,
        require: true 
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        required: true
    }, 
    lessonId: {
        type: String
    }, 
    likes: {
        type: Array,
        default: []
    }, 
    disLikes: {
        type: Array,
        default: []
    },
    usersLiked:{
        type: Object,
        default: {}
    },
    usersDisliked: {
        type: Object,
        default: {}
    }
}, {timestamps: true})

const Comment = mongoose.model('comments', CommentSchema)

module.exports = Comment