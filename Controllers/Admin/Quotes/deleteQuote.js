const Quote = require('../../../DB/models/Quote')
const { StatusCodes } = require('http-status-codes')
const { BadRequest, NotFound } = require('../../../Error/ErrorSamples')
const deleteQuote = async (req, res, next) => {
    try{
        const {id} = req.params 
        if(!id) throw new BadRequest("Please provide id of a quote")
        const removedQuote = await Quote.findByIdAndDelete(id)
        if(!removedQuote) throw new NotFound("This quote does not exist")
        return res.status(StatusCodes.OK).json({msg: "Quote has been deleted", removedQuote})
    }catch(err){
        return next(err)
    }
}

module.exports = deleteQuote