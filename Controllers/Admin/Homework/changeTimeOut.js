const Lesson = require('../../../DB/models/Lesson')
const { BadRequest } = require('../../../Error/ErrorSamples')
const { StatusCodes } = require('http-status-codes')
const joi = require('joi')

async function verifyBody(body){
    try{
        const joiSchema = joi.object({
            timeOutMinutes: joi.number().positive().required()
        })
        const {error, value} = joiSchema.validate(body)
        if(error) throw error 
        return value 
    }catch(err){
        throw err
    }
}

const changeTimeOut = async (req, res, next) =>{
    const lessonId = req?.params?.lessonId 
    try{
        if(!lessonId) throw new BadRequest("Lesson ID is missing")
        const { timeOutMinutes } = await verifyBody(req.body)
        const projection = { homeworkTimeOutMinutes: 1 }
        const lesson = await Lesson.findOneAndUpdate(
            {_id: lessonId},
            {homeworkTimeOutMinutes: timeOutMinutes},
            {new: true, projection})
        if(!lesson) throw new BadRequest(`Lesson with ID '${lessonId}' not found`)
        return res.status(StatusCodes.OK).json({msg: 'timeout has been updated', timeOut: lesson.homeworkTimeOutMinutes})
    }catch(err){
        return next(err)
    }
}
module.exports = changeTimeOut