const mongoose = require('mongoose')

const connect = async (uri) =>{
    return mongoose.connect(uri)
}
module.exports = connect