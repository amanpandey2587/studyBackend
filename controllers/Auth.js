const bcrypt=require("bcrypt");
const User=require("../models/User");
const OTP=require("../models/OTP");
const jwt=require("jsonwebtoken");
const optGenerator=require("otp-generator");
const mailSender=require("../utils/mailSender")
const emailTemplate = require("../mail/templates/emailVerificationTemplate");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();

// SignUp 
exports.signUp=async (req,res)=>{
    try{
        // data fetch from req body 
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp,
        }= req.body;

        // validation of data 
        // account type koi na koi toh selected hoga hi 
        // phone no jaruri nhi hai 
        if(!firstName || !lastName || !email || !password || !confirmPassword 
             || !otp){
                return res.status(403).json({
                    success:false,
                    message:"All fields are required",
                })
            }


        // 2no passwords match krlo
        if(password !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:"Password and ConfirmPassword value doesn't match, Please try again"
            });
        }

        // check user already exists or not 
        const existingUser=await User.findOne({email});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"User is already registered"
            });
        }

        // find most recent OTP from the user 
        const recentOtp=await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log("recentOtp :",recentOtp);


        // validate otp 
        if(recentOtp.length===0){
            // OTp not found 
            return res.status(400).json({
                success:false,
                message:"OTP not found",
            })
        } else if(otp!==recentOtp[0].otp){
            // Invalid OTP
            return res.status(400).json({
                success:false,
                message:"OTP is invalid"
            })
        }

        // Hash Password
        const hashedPassword=await bcrypt.hash(password,10);

        // creating entry in db 
        // create the user 
        let approved = "";
        approved==="Instructor" ? (approved=false) : (approved=true);

        // Creating additional profile for user 
        const profileDetails=await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        })

        const user=await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType,
            approved:approved,
            additionalDetails:profileDetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg/seed=${firstName} ${lastName}`
        })
        // returning response 
        return res.status(200).json({
            success:true,
            message:'User is registered successfully',
            user,
        })
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"User cannot be registered , pleasee try again",
        });
    }
}

// Login 
exports.login =async (req,res)=>{
    try{
        // get data from req body 
        const {email,password}=req.body;
        // validation of data 
        if(!email || !password){
            return res.status(403) .json({
                success:false,
                message:"All fields are required , please try again later"
            });
        }
        //check user exist or not 
        const user= await User.findOne({email}).populate("additionalDetails");
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User is not registered , please sign up first"
            });
        }
        // generate JWT ,after password matching 
        if(await bcrypt.compare(password,user.password)){
            const payload={
                email:user.email,
                id:user._id,
                accountType:user.accountType,
            }
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn:"2d"
            });
            user.token=token;
            user.password=undefined;
            
        // create cookie and send response 
        const options={
            expires:new Date(Date.now() + 3*24*60*60*1000),
            httpOnly:true,
        }

        res.cookie("token",token,options).status(200).json({
            success:true,
            token,
            user,
			message: `User Login Success`,

        })
        }

        else{
            return res.status(401).json({
                success:false,
                message:'Password is incorrect'
            })
        }
        

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Login failure , please try again later"
        })
    }

}
// send OTP
exports.sendOTP=async (req,res)=>{
    try{
        // fetch email from req body 
        const {email}=req.body;

        // check if user already exists or not 
        const checkUserPresent=await User.findOne({email});

        // if User already exists ,then return a response 
        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message:"User already registered "
            })
        }

        // generate OTP 
        var otp=optGenerator.generate(6,{
            upperCaseAlphabet:false,
            lowerCaseAlphabet:false,
            specialChars:false,
        });
        console.log("OTP generated: ",otp);

        // checking otp uniqueness
        const result = await OTP.findOne({otp:otp});

        while(result){
            otp=optGenerator.generate(6,{
                upperCaseAlphabet:false,
                lowerCaseAlphabet:false,
                specialChars:false,
            });
            result = await OTP.findOne({otp:otp});
        }

        const otpPayload={email,otp};
        // creating the DB entry for the otp 
        const otpBody=await OTP.create(otpPayload);
        console.log(otpBody);

        // Also add for email validation 
        await mailSender(email,"OTP- Validation",emailTemplate(otp)); 
        // return response successful 
        res.status(200).json({
            success:true,
            message:"OTP sent successfully",otp,
        })

    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}

// Change Password 
exports.changePassword = async (req, res) => {
    try {
        // get user data from req.user 
        const userDetails = await User.findById(req.user.id);

        // get old password,newpassword and confirnNewPassword 
        const {oldPassword,newPassword,confirmNewPassword}=req.body;

        // Validate old password 
        const isPasswordMatch=await bcrypt.compare(
            oldPassword,
            userDetails.password
        );
        if(!isPasswordMatch){
            // old password does not match -401 (Unauthorized) error
            return res.status(401).json({
                success:false,
                message:"The password is incorrect ",
            })
        }

        // Match new password and confirm newpasswordd
        if(newPassword !==confirmNewPassword){
            // not match - status(400) = Bad request 
            return res.status(400).json({
                success:false,
                message:"The password and confirm password doesnot match",
            })
        }

        // update password 
        const encryptedPassword=await bcrypt.hash(newPassword,10);
        const updatedUserDetails=await User.findByIdAndUpdate(
            req.user.id,
            {password:encryptedPassword},
            {new:true},
        );

        // Sending the notification email 
        try{
            const emailResponse=await mailSender(
                updatedUserDetails.email,
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`,
                )
            );
        }catch(error){
            // error in sending the email 
            console.error("error occurred while sending the email: ",error);
            return res.status(500).json({
                success:false,
                message:"Error occurred while sending the email ",
                error:error.message,
            });
        }
        // Return success response
        return res.status(200).json({
            success: true,
            message: "Password updated  successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Error in resetting password, please try again",
            error:error.message,
        });
    }
};
