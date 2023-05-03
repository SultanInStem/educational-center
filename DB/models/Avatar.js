const mongoose = require('mongoose')

const AvatarSchema = new mongoose.Schema({
    awsKey: {
        type: String,
        required: true
    }
})

const Avatar = mongoose.model('Avatars', AvatarSchema)
module.exports = Avatar