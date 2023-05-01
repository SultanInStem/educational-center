const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    profilePicture: {
        type: String,
        default: '' // set up default profile picture url 
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
    progressScore: { // reflects an overall score 
        type: Number,
        default: 0 
    },
    lastActive: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    completedLessons: {
        type: Array,
        default: []
    }, 
    completedCourses:{
        type: Array,
        default: []
    },
    currentScore: { // reflects the score in a certain course 
        type: Number,
        default: 0
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    course: {
        type: String
    },
    canComment: {
        type: Boolean,
        default: true
    },
    attempsToUpdatePassword: {
        type: Number,
        default: 0
    }
}, {timestamps: true})


UserSchema.pre('save', async function(){
    const salt = await bcrypt.genSalt()
    this.password = await bcrypt.hash(this.password, salt)
})
UserSchema.methods.CheckPassword = async function(password){
    const isMatch = await bcrypt.compare(password, this.password)
    return isMatch
}

const User = mongoose.model('users', UserSchema)

module.exports = User
