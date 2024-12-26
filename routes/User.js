// importing the required modules 
const express=require("express");
const router=express.Router()

// Importing all the controllers  
const {login,signUp,sendOTP,changePassword}
=require("../controllers/Auth")

const {resetPasswordToken,resetPassword}
=require("../controllers/ResetPassword")

const{auth}=require("../middlewares/auth")

// Router regarding User 
// 1)User login
router.post("/login",login)
// 2)signup 
router.post("/signup",signUp)
// 3)send otp 
router.post("/sendotp",sendOTP)
// 4)changing the password 
router.post("/changePassword",auth,changePassword)

// Reset Password 
// 1)resetPasswordToken 
router.post("/resetPasswordToken",resetPasswordToken)
// 2)resetPassword after verification 
router.post("/resetPassword",resetPassword)


// exporting the router 
module.exports=router 