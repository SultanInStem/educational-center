const mongoose = require('mongoose')

const LevelSchema = new mongoose.Schema({
    level: {
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

const Level = mongoose.model('levels', LevelSchema)

module.exports = Level