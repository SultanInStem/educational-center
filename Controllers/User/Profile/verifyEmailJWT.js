const jwt = require('jsonwebtoken')
async function verifyJWT(token){
    try{
        const data = jwt.verify(token, process.env.EMAIL_JWT_HASH)
        return data 
    }catch(err){
        throw err
    }
}

module.exports = verifyJWT