const { CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront')
const deleteCloudFiles = require('../../../helperFuncs/deleteCloudFiles')
const { BadRequest, NotFound } = require('../../../Error/ErrorSamples')
const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
const { StatusCodes } = require('http-status-codes')
const { s3, CloudFront } = require('../../../imports')
const Lesson = require('../../../DB/models/Lesson')
const Course = require('../../../DB/models/Course')
const mongoose = require('mongoose')

const deleteLesson = async (req, res, next) =>{
    const lessonId = req.params.id 
    if(!lessonId) throw new BadRequest('Please provide valid params for the url') 
    const session = await mongoose.startSession()
    session.startTransaction()
    let abortTransaction = false 
    try{
        const lesson = await Lesson.findOneAndDelete({_id: lessonId}, {session})
        if(!lesson){
            abortTransaction = true 
            throw new NotFound("Lesson Not Found")
        }
        const {videos, files} = lesson
        const course = await Course.findOneAndUpdate({name: lesson.course}, {
            $pull: {lessons: lesson._id}
        }, {new: true, session})
        if(!course){
            abortTransaction = true 
            throw new NotFound("Course Not Found")
        }
        const tempFiles = []
        Object.entries(videos).forEach(item => {
            if(item[1]){
                tempFiles.push(item[1])
            }
        })
        Object.entries(files).forEach(item =>{
            if(item[1]){
                tempFiles.push(item[1]['awsKey'])
            }
        })
        tempFiles.push(lesson.thumbNail)
        console.log(tempFiles)
        for(const item of tempFiles){
            if(item){
                console.log(item)
                await deleteCloudFiles(item)
            }
        }
        const transaction = await session.commitTransaction()
        return res.status(StatusCodes.OK).json({msg: 'Lesson has been deleted'})
    }catch(err){
        console.log(err)
        abortTransaction = true 
        return next(err)
    }finally{
        if(abortTransaction){
            await session.abortTransaction()
        }
        await session.endSession()
    }
}
module.exports = deleteLesson