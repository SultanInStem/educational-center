const { getSignedUrl } = require('@aws-sdk/cloudfront-signer')
function getUrl(key, expiresIn=1000*60*60*48){
    const signedUrl = getSignedUrl({
        keyPairId: process.env.AWS_CLOUD_KEY_PAIR_ID,
        privateKey: process.env.PRIVATE_KEY,
        url: process.env.AWS_CLOUD_DOMAIN + `/${key}`,
        dateLessThan: new Date(Date.now() + expiresIn)
    })
    return signedUrl
}

module.exports = getUrl