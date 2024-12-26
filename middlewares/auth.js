const jwt=require("jsonwebtoken");
require("dotenv").config();
const User=require("../models/User");

// auth 
exports.auth=async(req,res,next)=>{
    console.log("enter the function")
    try{
        // check for authentication by verifying of json web token

        // extract token
        console.log("Before fetching token");
        console.log("req.cookies.token:", req.cookies.token);
        console.log("req.body.token:", req.body.token);
        console.log("req.header('Authorization'):", req.header("Authorization"));
        
        const token = req.header("Authorization")?.replace("Bearer ", "")
                      || req.body.token
                      || req.cookies.token
       ;        
        console.log("After fetching token", token);
        
        // if token is missing , return response 
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Token is missing",
            });
        }

        // Verify the token using jwt secret 
        try{
            const decode= jwt.verify(token,process.env.JWT_SECRET);
            console.log("Decoded info is : ",decode);
            req.user=decode;
        }
        catch(error){
            // verification issue 
            return res.status(403).json({
                success:false,
                message:"Token is invalid",
            })
        }    
    next();
    }
    catch(error){
        return res.status(401).json({
            success:false,
            message:"Something went wrong while validating the token"
        })
    }
}
// isStudent 
exports.isStudent=(req,res,next)=>{
    try{
        // one method is that we have in previous AuthZ and AuthN
        if(req.user.accountType!=="Student"){
            return res.status(403).json({
                success:false,
                message:"This is a protected route for students only."
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User role is not verified , please try again"
        })

    }
}

// isInstructor
exports.isInstructor=async (req,res,next)=>{
    try{
        if(req.user.accountType!=="Instructor"){
            return res.status(403).json({
                success:false,
                message:"This is the protected route for instructor only "
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User not verified , please try again later"
        })
    }
}

// isAdmin - For the site admins only- for further designing
exports.isAdmin=async (req,res,next)=>{
    try{
        console.log("Account type is ",req.user.accountType)
        if(req.user.accountType!== "Admin"){
            return res.status(403).json({
                success:false,
                message:"This is the protected routes for Admins"
            })
        }
        next();
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"User not verified, please try again later"
        })
    }
}
