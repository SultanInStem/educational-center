const { CloudFront } = require('../imports')
const { CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront')

async function deleteFromCloud(objectKey){
    try{
        const invalidateCommand = new CreateInvalidationCommand({
            DistributionId: process.env.AWS_CLOUD_DISTRIBUTION_ID,
            InvalidationBatch: {
                CallerReference: objectKey,
                Paths: {
                    Items: [`/${objectKey}`],
                    Quantity: 1
                }
            }
        })
        const response = await CloudFront.send(invalidateCommand)
        return response 
    }catch(err){
        throw err
    }
}
module.exports = deleteFromCloud