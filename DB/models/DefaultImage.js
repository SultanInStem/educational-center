const mongoose = require('mongoose')
const DefaultSchema = new mongoose.Schema({
    awsKey: {
        type: String,
        required: true
    },
    role: {
        type: String,
        reuqired: true
    }
})

const DefaultImage = mongoose.model("DefaultImages", DefaultSchema)

module.exports = DefaultImage