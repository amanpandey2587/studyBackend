const {contactUsEmail}=require("../mail/templates/contactFormRes")
const mailSender=require("../utils/mailSender")

exports.contactUsController=async(req,res)=>{
    const {email,firstName,lastName,message,phoneNo}=req.body;
    console.log(req.body)
    try{
        const emailRes=await mailSender(
            email,"Your Data sent successfully ",
            contactUsEmail(email,firstName,lastName,message,phoneNo)
        )
        console.log("Email Res",emailRes)
        return res.status(200).json({
            success: true,
            message: "Email send successfully",
          })
    }catch(error){
        console.log("Error in sending the contactUsResponse",error.message)
        return res.json({
            success:false,
            message:"Something went wrong at sending response "
        })
    }
}