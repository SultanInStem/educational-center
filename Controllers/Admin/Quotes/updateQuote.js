const { StatusCodes } = require('http-status-codes')
const Quote = require('../../../DB/models/Quote')
const { BadRequest, NotFound } = require('../../../Error/ErrorSamples')

const updateQuote = async (req, res, next) => {
    try{
        const {id} = req.params
        const {quote, author} = req.body 
        if(!quote || !author) throw new BadRequest("Please provide valid quote and author")
        else if(!id || id.length < 12) throw new BadRequest("Please provide valid id in the params")
        const editedQuote = await Quote.findByIdAndUpdate(id, {$set: {quote: quote, author: author}}, {new: true}) 
        if(!editedQuote) throw new NotFound("Quote with that id not found")
        return res.status(StatusCodes.OK).json({msg: "Quote has been updated", editedQuote})
    }catch(err){
        return next(err)
    }
}

module.exports = updateQuote 