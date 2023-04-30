const { StatusCodes } = require('http-status-codes')
const User = require('../../../DB/models/User')
const { BadRequest } = require('../../../Error/ErrorSamples')
const joi = require('joi')
const getUrl = require('../../../helperFuncs/getUrl')

async function verifyQuery(query){
    try{
        const joiSchema = joi.object({
            lim: joi.number().positive().allow(0),
            skip: joi.number().positive().allow(0)
        })
        const {error, value} = joiSchema.validate(query)
        if(error) throw error
        return value 
    }catch(err){
        throw err
    }
}

const getUsers = async(req, res, next) =>{
    try{
        if(req.query.lim && req.query.skip){
            req.query.lim = Number(req.query.lim)
            req.query.skip = Number(req.query.skip)
        }else{
            throw new BadRequest("Valid Query Parameters Must Be Provided")
        }
        const { lim, skip } = await verifyQuery(req.query)
        const includedPropterties = { isActive: 1, 
            email: 1, 
            course: 1, 
            age: 1, 
            profilePicture: 1, 
            name: 1,
            gender: 1
        }
        const users = await User.find({}, includedPropterties).sort({createdAt: 1}).limit(lim).skip(skip) // make limit flexible
        for(const user of users){
            if(user.profilePicture){
                user.profilePicture = getUrl(user.profilePicture)
            }
        }
        return res.status(StatusCodes.OK).json({users})
    }catch(err){
        return next(err)
    }
}

module.exports = getUsers