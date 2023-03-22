const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    progressLevel: {
        type: Number,
        default: 0 
    },
    lastActive: {
        type: Date,
        required: true,
        default: Date.now()
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true
    },
    completedLessons: {

    },
    completedLevels:{

    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    level: {

    }
}, {timestamps: true})

const User = mongoose.model('users', UserSchema)

module.exports = User