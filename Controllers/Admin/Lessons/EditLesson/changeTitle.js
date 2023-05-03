const Lesson = require('../../../../DB/models/Lesson')
const joi = require('joi')
const { BadRequest, NotFound } = require('../../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')

const verifyBody = async (data) => {
    try{
        const joiSchema = joi.object({
            title: joi.string().required().min(4).max(20)
        })
        const {error, value} = joiSchema.validate(data)
        if(error){
            throw error
        }
        return value
    }catch(err){
        throw err
    }
}
const changeTitle = async (req, res, next) =>{
    const lessonId = req.params?.lessonId 
    console.log(lessonId)
    try{
        if(lessonId.length < 10) throw new BadRequest("Valid Lesson ID must be provided")
        const { title } = await verifyBody(req.body)
        const lesson = await Lesson.findByIdAndUpdate(lessonId, {$set: {title: title}}, {projection: {title:1}})
        if(!lesson) throw new NotFound(`Lesson with ID ${lessonId} not found`)
        return res.status(StatusCodes.OK).json({msg: 'Lesson has been updated', title})
    }catch(err){
        return next(err)
    }
}

module.exports = changeTitle