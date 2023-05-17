const { StatusCodes } = require('http-status-codes')
const Quote = require('../../../DB/models/Quote')

const getAllQuotes = async (req, res, next) => {
    try{
        const quotes = await Quote.find()
        return res.status(StatusCodes.OK).json({msg: "here you go", quotes})
    }catch(err){
        return next(err)
    }
}

module.exports = getAllQuotes