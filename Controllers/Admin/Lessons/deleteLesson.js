const { CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront')
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
        const {videos, files} = lesson
        if(!lesson){
            abortTransaction = true 
            throw new NotFound("Lesson Not Found")
        }
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
                const res_s3 = await deleteFromS3(item)
                const res_cloud = await invalidateCash(item)
                // console.log(res_s3)
                // console.log(res_cloud)
            }
        }
        const transaction = await session.commitTransaction()
        console.log(transaction)
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
async function deleteFromS3(id){
    try{
        const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: id
        })
        const response = await s3.send(deleteCommand)
        return response 
    }catch(err){
        console.log(err)
        throw err 
    }
}

async function invalidateCash(id){
    try{
        const invalidationCommand = new CreateInvalidationCommand({
            DistributionId: process.env.AWS_CLOUD_DISTRIBUTION_ID, 
            InvalidationBatch: {
                CallerReference: id,
                Paths: {
                    Quantity: 1,
                    Items: [`/${id}`]
                }
            }
        })
        const response = await CloudFront.send(invalidationCommand) 
        return response 
    }catch(err){
        console.log(err)
        throw err 
    }
}

module.exports = deleteLesson