const { METHOD_FAILURE } = require('http-status-codes')
const mongoose = require('mongoose')

const QuizSchema = new mongoose.Schema({
    qustionPrompt: {
        type: String,
        required: true 
    },
    options: {
        type: Array, 
        required: true 
    },
    answer: {
        type: String,
        required: true
    }
})

const Quiz = mongoose.model('quizes', QuizSchema)

module.exports = Quiz 
