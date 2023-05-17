const Quote = require('../../../DB/models/Quote')
const { BadRequest } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const createQuote = async (req, res, next) => {
    try{
        const {quote, author} = req.body 
        if(!quote || !author) throw new BadRequest('Please provide valid quote and author')
        const createdQuote = await Quote.create({quote, author})
        return res.status(StatusCodes.OK).json({msg: "Quote has been added", createdQuote})
    }catch(err){
        return next(err)
    }
}

module.exports = createQuote 