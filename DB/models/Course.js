const mongoose = require('mongoose')

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    coursePicture: {
        type: String, 
        default: "" // set up default picture 
    }, 
    minScore: {
        type: Number,
        required: true
    },
    lessons: {
        type: Array,
        default: []
    }
})

const Course = mongoose.model('course', CourseSchema)

module.exports = Course