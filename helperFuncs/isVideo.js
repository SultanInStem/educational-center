const {supportedVideoFormatsArray} = require('../imports')
function isVideo(filename){
    const extension = filename.substr(filename.lastIndexOf('.')).toLowerCase()
    return supportedVideoFormatsArray.includes(extension)
}
module.exports = isVideo