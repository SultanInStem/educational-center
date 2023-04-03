const User = require('../DB/models/User')
const jwt = require('jsonwebtoken')
const isAdmin = async (userId) =>{ // this shit returns function instead of boolean value. Deal with this!
    try{
        let res = false; 
        const isAdmin = jwt.verify(token, process.env.JWT_ACCESS_KEY, async (err, decoded)=>{
            if(err){
                res = false 
                return 
            }
            const user = await User.findById(userId)
            if(!user){
                res = false 
                return 
            }
            if(user.isAdmin === true){
                res = true
                return 
            }else{
                res = false
                return 
            }
        })
        return res
    }catch(e){
        return false 
    }
}
module.exports = isAdmin