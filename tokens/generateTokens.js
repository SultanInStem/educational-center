const jwt = require('jsonwebtoken')
const createAccessToken = (userId) =>{
    return jwt.sign({userId}, process.env.JWT_ACCESS_KEY, {expiresIn: process.env.JWT_ACCESS_LIFE})
}

const createRefreshToken = (userId) =>{
    return jwt.sign({userId}, process.env.JWT_REFRESH_KEY, {expiresIn: process.env.JWT_REFRESH_LIFE})
}

module.exports = {
    createAccessToken,
    createRefreshToken
}