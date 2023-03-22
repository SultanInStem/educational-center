const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
    comment: {
        type: String,
        require: true 
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        required: true
    }    
}, {timestamps: true})

const Comment = mongoose.model('comments', CommentSchema)

module.exports = Comment