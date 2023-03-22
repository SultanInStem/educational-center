const User = require('../DB/models/User')
const joi = require('joi')
const nodemailer = require('nodemailer')


const SignUp = async(req, res, next) =>{
    const signupSchema = joi.object({
        name: joi.string().required().min(3),
        email: joi.string().email().required(),
        password: joi.string().min(6).max(12),
        age: joi.number().required()
    })
    const {error, value} = signupSchema.validate(req.body)
    if(error){
        // error handling 
        return next(error)
    }
    try{

    }catch(err){
        return next(err)
    }
}
const Login = async(req, res, next) =>{
    try{

    }catch(err){

    }
}