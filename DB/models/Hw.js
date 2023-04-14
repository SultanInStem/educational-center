const mongoose = require('mongoose')

const HwSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Question is required"]
    },
    options: {
        type: Array,
        default: []
    },
    correctAnswer: {
        type: String,
        required: [true, "Correct Answer is required"]
    },
    lessonId: {
        type: mongoose.Types.ObjectId,
    }
})

const Homework = mongoose.model('homework', HwSchema)

module.exports = Homework