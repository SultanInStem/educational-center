const mongoose = require('mongoose')


const QuoteSchema = new mongoose.Schema({
    quote: {
        type: String,
        required: true 
    },
    author: {
        type: String,
        required: true
    }
})

const Quote = mongoose.model("quotes", QuoteSchema)

module.exports = Quote