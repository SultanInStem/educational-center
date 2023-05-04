const jwt = require('jsonwebtoken')

async function makeEmailURL(clientDomain, payload, expiresIn='1d'){
    try{
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_KEY, {expiresIn})
        const token = jwt.sign({...payload, accessToken}, process.env.EMAIL_JWT_HASH, {expiresIn})
        const url = clientDomain + `/${token}`
        return url
    }catch(err){
        throw err
    }
}
module.exports = makeEmailURL