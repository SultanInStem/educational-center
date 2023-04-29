const Lesson = require('../../../../DB/models/Lesson')
const joi = require('joi')
const { BadRequest, NotFound } = require('../../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const verifyBody = async(data) =>{
    try{
        const joiSchema = joi.object({
            description: joi.string().required().min(5)
        })
        const {error, value} = joiSchema.validate(data)
        if(error) throw error 
        return value.description 
    }catch(err){
        throw err
    }
}
const changeDescription = async(req, res, next) => {
    const {lessonId} = req.params 
    try{
        if(lessonId.length < 10) throw new BadRequest("Valid Lesson ID must be provided")
        const description = await verifyBody(req.body)
        const lesson = await Lesson.findByIdAndUpdate(lessonId, {$set: {description: description}})
        if(!lesson) throw new NotFound(`Lesson with ID ${lessonId} not found`)
        return res.status(StatusCodes.OK).json({msg: "Lesson has been updated", description})
    }catch(err){
        return next(err)
    }
}
module.exports = changeDescription