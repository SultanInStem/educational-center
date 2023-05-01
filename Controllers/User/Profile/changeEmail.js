const { StatusCodes } = require('http-status-codes')
const Sib = require('sib-api-v3-sdk')
const client = Sib.ApiClient.instance 
const apiKey = client.authentications['api-key']
const changeEmail = async (req, res, next) =>{
    try{
        const emailResponse = await transEmailsApi.sendTransacEmail({
            sender: senderObject,
            to: receiver,
            subject: "Verify changing email address",
            textContent: ''
        })
        return res.status(StatusCodes.OK).json({msg: 'email has been sent'})
    }catch(err){
        return next(err)
    }
}

module.exports = changeEmail