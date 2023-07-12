const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');

const otpSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires: 5*60
    },
})

//preMiddleware to send email for verification before creating DB entry
async function sendVerificationEmail(email, otp){
    try{
        const mailResponse = await mailSender(email, "Verification email from StudyNotion", otp)
        
        console.log("Mail sent successful: ",mailResponse);



    }catch(err){
        console.log("Error occured while sending main: ", err);
        throw error;
    }
}
otpSchema.pre("save", async function(next){
    await sendVerificationEmail(this.email, this.otp) 
})


module.exports = mongoose.model('OTP',otpSchema);