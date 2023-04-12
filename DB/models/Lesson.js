const mongoose = require('mongoose')

const LesssonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    thumbNail: {
        type: String,
        default: '' // set up default url to thumbnail in AWS if it was not provided
    },
    files: {
        type: Array,
        default: []
    },
    videos: {
        russian: {
            type: String
        },
        uzbek: {
            type: String
        },
        english: {
            type: String
        }
    },
    comments: {
        type: Array
    },
    homework: {
        type: Array, // here we will store id's of questions ,
        default: []
    },
    level: {
        type: String
    }
})

const Lesson = mongoose.model('lessons', LesssonSchema)
module.exports = Lesson