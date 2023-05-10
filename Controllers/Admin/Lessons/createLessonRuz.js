const { BadRequest } = require('../../../Error/ErrorSamples')
const { deleteLocalFiles } = require('../../../helperFuncs/deleteLocalFiles')
const isVideo = require('../../../helperFuncs/isVideo')
const isImage = require('../../../helperFuncs/isImage')
const genKey = require('../../../helperFuncs/genS3Key')
const { StatusCodes } = require('http-status-codes')
const Lesson = require('../../../DB/models/Lesson')
const Course = require('../../../DB/models/Course')
const mongoose = require('mongoose')
const path = require('path')
const joi = require('joi')
const fs = require('fs')
const {
    levelsArray 
} = require('../../../imports')
const uploadsFolderPath = path.join(__dirname, '..', '..', '..', 'uploads')
const DefaultImage = require('../../../DB/models/DefaultImage')
const uploadToS3 = require('../../../helperFuncs/uploadFileS3')
const deleteCloudFiles = require('../../../helperFuncs/deleteCloudFiles')

async function verifyInputs(req){
    const jsondataValidation = joi.object({
        course: joi.string().valid(...levelsArray).insensitive(),
        title: joi.string().min(4).max(30),
        description: joi.string().min(5)
    })
    try{
        const {jsondata} = req.body
        if(!jsondata) throw BadRequest("Provide all of the essential information regarding the lesson")
        const parsedJson = await JSON.parse(jsondata)
        const {error, value} = jsondataValidation.validate(parsedJson)
        if(error) throw error
        let videoNumber = 0; 
        let imageNumber = 0; 
        const uppercaseLevel = value.course.toUpperCase()
        value.course = uppercaseLevel 
        const files = await new Promise((resolve, reject) =>{
            fs.readdir(uploadsFolderPath, (err,files) =>{
                if(err){
                    console.log(err)
                    reject(err)
                }
                files.forEach(item => {
                    if(isImage(item)){
                        imageNumber += 1 
                    }else if(isVideo(item)){
                        videoNumber += 1 
                    }
                })
                if(videoNumber !== 2 || imageNumber > 1){
                    if(videoNumber > 2){
                        reject(new BadRequest(`Only two videos are allowed, ${videoNumber} videos were provided`))
                    }else if(imageNumber > 1){
                        reject(new BadRequest(`Only one image is allowed. ${imageNumber} are uploaded`))
                    }else if(videoNumber < 2){
                        reject(new BadRequest(`Two videos are required, ${videoNumber} was provided`))
                    }
                }
                resolve(files)
            })
        })
        return {json: value, fileNames: files}
    }catch(err){
        throw err
    }
}
const createLessonRuz = async(req, res, next) =>{
    const session = await mongoose.startSession()
    session.startTransaction()
    let abortTransaction = false
    const modifiedFiles = [] 
    try{
        const {json} = await verifyInputs(req)
        const files = req.files
        const lesson = new Lesson(json)
        for(const item in files){
            const file = files[item][0]
            if(file){
                file.awsKey = genKey(16) + file.filename 
                const response = await uploadToS3(file, "inline")
                console.log(response)
                const fieldname = file.fieldname 
                switch(fieldname){
                    case "videoRu": 
                    lesson.videos['russian'] = file.awsKey 
                    break; 
                    case "videoUz": 
                    lesson.videos['uzbek'] = file.awsKey 
                    break; 
                    case "image":
                    lesson.thumbNail = file.awsKey 
                    break; 
                    default: 
                    console.log('smth is off')
                }
            }
        }
        
        if(lesson.thumbNail.length < 1){
            const defaultImage = await DefaultImage.findOne({role: 'lesson'})
            lesson.thumbNail = defaultImage.awsKey 
        }
        await lesson.save({session})
        const course = await Course.findOneAndUpdate({name: json.course}, { 
            $push: {lessons: lesson._id}
        }, {new: true, session})
        if(!course){
            abortTransaction = true 
            throw new BadRequest("Failed to create the lesson")
        }
        await session.commitTransaction()
        return res.status(StatusCodes.CREATED).json({msg: 'Lesson has been uploaded', lesson})
    }catch(err){
        abortTransaction = true
        for(const item of modifiedFiles){
            await deleteCloudFiles(item.awsKey)
        }            
        return next(err)
    }finally{
        if(abortTransaction){
            await session.abortTransaction()
        }
        await deleteLocalFiles()
        await session.endSession()
    }
}

module.exports = createLessonRuz