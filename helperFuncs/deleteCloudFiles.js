
const deleteFromS3 = require('./deleteFromS3')
const invlidateCash = require('./invlidateCash')

const deleteCloudFiles = async (objectKey) => {
    try{
        const responseS3 = await deleteFromS3(objectKey)
        const reponseCloud = await invlidateCash(objectKey)
        console.log(responseS3)
        console.log(reponseCloud)
        console.log('FILE HAS BEEN DELETED FROM THE BUCKET')
        return true
    }catch(err){
        throw err
    }
}

module.exports = deleteCloudFiles