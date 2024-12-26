const mongoose=require("mongoose");
// Parchai , obsessed ,
const profileSchema = new mongoose.Schema({
    gender:{
        type:String,
    },
    dateOfBirth:{
        type:String,
    },
    about:{
        type:String,
        trim:true,
    },
    contactNumber:{
        type:Number,
        trim:true,
    }
});

// export the profile model
module.exports=mongoose.model("Profile",profileSchema);
