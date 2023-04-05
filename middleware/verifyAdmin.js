const { StatusCodes } = require("http-status-codes")
const jwt = require('jsonwebtoken')
const isAdmin = require('../helperFuncs/checkIfAdmin')
const verifyAdmin = async (req, res, next) => {
    const headers = req.headers.authorization 
    if(!headers || !headers.startsWith('Bearer')) return res.status(StatusCodes.BAD_REQUEST).json({err: 'Bad Request'})
    const token = headers.split(' ')[1] 
    try{
        jwt.verify(token, process.env.JWT_ACCESS_KEY, async (err, decoded) =>{
            if(err){
                return res.status(StatusCodes.UNAUTHORIZED).json({err: 'Unathorized'})
            }
            const isValidAdmin = await isAdmin(decoded.userId)
            if(!isValidAdmin) return res.status(StatusCodes.UNAUTHORIZED).json({err: 'Unathorized'})
            req.userId = decoded.userId 
            next()
        })
    }catch(err){
        return res.status(StatusCodes.BAD_REQUEST).json({err})
    }
}

module.exports = verifyAdmin