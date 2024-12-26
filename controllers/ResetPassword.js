const User=require("../models/User");
const mailSender=require("../utils/mailSender");
const bcrypt=require("bcrypt");
// Whenever password is forgot ->link generate from frontend ,
// email send ->open in UI -> new password ->update 


// resetPasswordToken 
exports.resetPasswordToken=async (req,res)=>{
    try{
    // get email from req body 
    const email=req.body.email;
    // check user for this email ,email validation 
    const userEmail=await User.findOne({email:email});
    if(!userEmail){
        return res.status(403).json({
            success:false,
            message:"Your email is not registered with us"
        })
    }
    // generate token 
    const token = crypto.randomUUID();
    // update user by adding token and expiration time 
    const updatedDetails=await User.findOneAndUpdate(
                                    {email:email},
                                    {
                                        token:token,
                                        resetPasswordExpires:Date.now() +5*60*1000,
                                    },{new:true});
    console.log("Details",updatedDetails);
    // create url 
    const url =`http://localhost:3000/update-password/${token}`
    // send mail containing the url
    await mailSender(
        email,
        "Password Reset Link",
        `Password reset link: ${url}`
    );
    // return response 
    return res.json({
        success:true,
        message:`Email sent successfully ,please check email and change password `
    })
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while sending the password email "
        })
    }
}
// resetPassword
exports.resetPassword= async (req,res)=>{
    try{
        // data fetching 
        const {password,confirmPassword,token}=req.body;
        // validation
        if(password!==confirmPassword){
            return res.json({
                success:false,
                message:"Password isn't matching ,please enter it correctly"
            });
        };
        // get userDetails from db using token
        const userDetails = await User.findOne({token:token});
        // if no entry - invalid token
        if(!userDetails){
            return res.json({
                success:false,
                message:"token is invalid"
            })
        }
        // || token time expire 
        if(userDetails.resetPasswordExpires <Date.now()){
            return res.json({
                success:false,
                message:"Token is expired, please regenerate your token ",
            })
        }
        // hashing password 
        const hashedPassword=await bcrypt.hash(password,10);
        // update the password 
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true},
        )
        // return response 
        return res.status(200).json({
            success:true,
            message:"Password is reset successfully"
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while resetting the password "
        })
    }
}


