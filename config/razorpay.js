// Generating instance of Razorpay ,could be done in controllers/payments too 
// or in utils folder but here we are doing this since it is just a configuration

const Razorpay=require("razorpay");

exports.instance=new Razorpay ({
    key_id:process.env.RAZORPAY_KEY,
    key_secret:process.env.RAZORPAY_SECRET,

})
