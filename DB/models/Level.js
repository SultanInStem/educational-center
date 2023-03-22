const mongoose = require('mongoose')

const LevelSchema = new mongoose.Schema({
    level: {
        type: String,
        required: true,
        unique: true
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