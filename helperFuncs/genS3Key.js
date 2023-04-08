const crypto = require('crypto')

const genKey = (bytes=32) => {
    return crypto.randomBytes(bytes).toString('hex')
}
module.exports = genKey