const User = require('../DB/models/User')
const isAdmin = async (userId) =>{ 
    try{
        const user = await User.findOne({_id: userId})
        if(user.isAdmin){
            return true
        }else{
            return false
        }
    }catch(e){
        return false 
    } 
}
module.exports = isAdmin