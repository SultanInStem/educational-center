const Quote = require('../../../DB/models/Quote')
const { BadRequest, NotFound } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const getQuote = async (req, res, next) => {
    try{
        const quote = await Quote.findOne({isMain: true})
        if(!quote) throw new NotFound("Quote not found")
        return res.status(StatusCodes.OK).json({quote})
    }catch(err){
        return next(err)
    }
}

module.exports = {
    getQuote
}