const mongoose=require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");
const OTPSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:5*60,
    }
});

// a function to send emails 
// async function sendVerificationEmail(email,otp){
//     try{
//         const mailResponse = await mailSender(
//             email,
//             "Verification Email from StudySync",
//             emailTemplate(otp)
//              );
//         console.log("Email Sent Successfully",mailResponse);
//     }
//     catch(error){
//         console.log("Error Occurred while Sending email",error);
//         throw error;
//     }
// }

// // post hook to send email after the document has been saved 
// OTPSchema.pre("save",async function(next){
//     console.log("New document saved to database ");

//     // only send an email when a new document is created 
//     if(this.isNew){
//     await sendVerificationEmail(this.email,this.otp);
//     }
//     next();
// });

module.exports=mongoose.model("OTP",OTPSchema);