const {supportedImageFormatsArray} = require('../imports')
function isImage(filename){
    const extension = filename.substr(filename.lastIndexOf('.')).toLowerCase()
    return supportedImageFormatsArray.includes(extension)
}
module.exports = isImage