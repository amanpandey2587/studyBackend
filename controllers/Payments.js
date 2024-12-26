const {instance} =require("../config/razorpay");
const Course=require("../models/Course");
const User=require("../models/User");
const mailSender=require("../utils/mailSender");
const {courseEnrollmentEmail}=require("../mail/templates/courseEnrollmentEmail");
const {default:mongoose} = require("mongoose");
const {paymentSuccessEmail}=require("../mail/templates/paymentSuccessfulEmail")
const crypto=require("crypto")
const CourseProgress=require("../models/CourseProgress")
        //use of documentation is must


// The below code is for ordering a single payment ,now we are adding a cart initialisation and then make payment
// // Capture the payment and initiate the Razorpay order 
// exports.capturePayment = async (req,res)=>{
//     try{
//         // get courseId and userId
//         const {courseId} =req.body;
//         const {userId}=req.user.id;

//         // validation 
//         // valid courseId 
//         if(!courseId){
//             return res.json({
//                 success:false,
//                 message:"Please enter a course Id ",
//             })
//         }
//         // valid courseDetail
//         let course;
//         try{
//             course = await Course.findById(courseId);
//             if(!course){
//                 return res.json({
//                     success:false,
//                     message:"could not find the course",
//                 })
//             }

//         // user already pay for the same course 
//         // it is done by getting user id not in string form but in object id form 
//         const uid = new mongoose.Types.ObjectId(userId);
//         if(course.studentsEnrolled.includes(uid)){
//             return res.status(200).json({
//                 success:false,
//                 message:"Student is already enrolled ",
//             })
//         }
//         }
//         catch(error){
//             console.log(error);
//             console.error(error);
//             return res.status(500).json({
//                 success:false,
//                 message:"could not generate the course details ,please try later "
//             })
//         }


//         //main kaam - order create 
//         const amount = course.price;
//         const currency="INR";
//         const options={
//             amount:amount*100,
//             currency,
//             receipt:Math.random(Date.now()).toString(),
//             notes:{ 
//             //used in signature verification kyuki waha pe hme userId etc req ki body se nhi milne wala hai 
//                 courseId:courseId,
//                 userId,
//             }
//         };

//         try{
//             // initiate the payment using razorpay
//             const paymentResponse = await instance.orders.create(options);
//             console.log("Payment response is: ",paymentResponse);
//             // return response 
//             return res.status(200).json({
//                 success:true,
//                 courseName:course.courseName,
//                 courseDescription:course.courseDescription,
//                 thumbnail:course.thumbnail,
//                 orderId:paymentResponse.id,
//                 currency:paymentResponse.currency,
//                 amount:paymentResponse.amount,
//             });

//         }catch(error){
//             console.error(error);
//             return res.json({
//                 success:false,
//                 message:"Couldn't inititate resposne "
//             })
//         }
//         // return response 
//     }
//     catch(error){
//         console.error(error);
//         return res.status(500).json({
//             success:false,
//             message:"Error in capturing the payment and initiating the Razorpay order ",
//         });
//     }
// }

// // verify Signature of Razorpay and Server 

// exports.verifySignature = async (req,res)=>{
//     try{
//         // assuming server ka secret ye rha 
//         // dusra secret razorpay se aayega after webhook is created in it 
//         const webhookSecret="123456789";

//         const signature = req.headers["x-razorpay-signature"];
//         // Hmac- Hashed Based method authenication code -> naam hi kaafi hai 
//         // Sha - secure hashing algorithm

//         const shasum = crypto.createHmac("sha256",webhookSecret);
//         shasum.update(JSON.stringify(req.body));
//         const digest= shasum.digest("hex");

//         if(signature===digest){
//             console.log("Payment is authorised ");
        

//         const {courseId,userId}=req.body.payload.payment.entity.notes;

//         try{
//             // fulfill the action 

//             // find the course and enroll the student in it 
//             const enrolledCourse= await Course.findOneAndUpdate(
//                 {_id:CourseId},
//                 {$push:{studentsEnrolled:userId}},
//                 {new:true},
//             );
//             // Validating the response of above query 
//             if(!enrolledCourse){
//                 return res.status(500).json({
//                     success:false,
//                     message:"Course not found ",
//                 })
//             }
//             console.log(enrolledCourse);

//             // find the student and add the course to their list enrolled courses mai 
//             const enrolledStudent = await User.findOneAndUpdate(
//                                             {_id:userId},
//                                             {$push:{courses:courseId}},
//                                             {new:true},
//             );
            
//             console.log(enrolledStudent);

//             // mail send krdo confirmation wala 
//             const emailResponse =await mailSender(
//                 enrolledStudent.email,
//                 "Congratulations from Aman Pandey ",
//                 "Congo ,you are enrolled into new studysync code ",
                
//             );
//             console.log(emailResponse);
//             return res.status(200).json({
//                 success:true,
//                 message:"Student enrolled successfully "
//             })

//         }catch(error){
//             return res.status(400).json({
//                 success:false,
//                 message:"student enrollment failed ",
//             })
//         }

//     }
//         // if signature != digest 
//         else{
//             return res.status(400).json({
//                 success:false,
//                 message:"Invalid signature , mismatch occurred ",
//             })
//         }
//     }
//     catch(error){
//         return res.status(500).json({
//             success:false,
//             message:"Error in verifying the signature "
//         })
//     }
// }




exports.capturePayment = async(req, res) => {

    const {courses} = req.body;
    const userId = req.user.id;
    console.log("userId is ",userId);
    if(courses.length === 0) {
        return res.json({success:false, message:"Please provide Course Id"});
    }

    let totalAmount = 0;

    for(const course_id of courses) {
        let course;
        try{
           
            course = await Course.findById(course_id);
            if(!course) {
                return res.status(200).json({success:false, message:"Could not find the course"});
            }

            const uid  = new mongoose.Types.ObjectId(userId);
            if(course.studentsEnrolled.includes(uid)) {
                return res.status(200).json({success:false, message:"Student is already Enrolled"});
            }

            totalAmount+=course.price;
        }
        catch(error) {
            console.log(error);
            return res.status(500).json({success:false, message:error.message});
        }
    }
    const currency = "INR";
    const options = {
        amount: totalAmount * 100,
        currency,
        receipt: Math.random(Date.now()).toString(),
    }

    try{
        const paymentResponse = await instance.orders.create(options);
        res.json({
            success:true,
            message:paymentResponse,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({success:false, mesage:"Could not Initiate Order"});
    }

}

// verify the payment
exports.verifyPayment = async (req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment Failed: Missing fields" });
    }

    try {
        // Generate the expected signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
                                        .update(body.toString())
                                        .digest("hex");

        // Verify the signature
        if (expectedSignature === razorpay_signature) {
            // Enroll the student
            await enrollStudents(courses, userId, res);

            // Return success response
            return res.status(200).json({ success: true, message: "Payment Verified" });
        }

        // Signature mismatch
        return res.status(403).json({ success: false, message: "Payment Failed: Signature Mismatch" });

    } catch (error) {
        // Catch unexpected errors
        console.error("Error verifying payment:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Function to enroll students which is being used above
const enrollStudents=async(courses,userId,res)=>{
    if(!courses || !userId){
        return res.status(400).json({success:false,message:"Please provide courses and userId"})
    }
    for(const courseId of courses){
        try{
            const enrolledCourse=await Course.findOneAndUpdate(
                {_id:courseId},
                {$push:{studentsEnrolled:userId}},
                {new:true},
            )
            if(!enrolledCourse){
                return res.status(500).json({
                    success:false,
                    message:"Course not found"
                });
            }

    
            const courseProgress=await CourseProgress.create({
                courseID:courseId,
                userId:userId,
                completedVideos:[],
            })
            const enrolledStudent=await User.findByIdAndUpdate(userId,
                {$push:{
                    courses:courseId,
                    courseProgress:courseProgress._id
                }},{new:true})
            
           
            
            const emailResponse=await mailSender(
                enrollStudents.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(enrolledCourse.courseName,`${enrolledStudent.firstName}`)
            )
        }catch(error){
            console.log(error);
            return res.status(500).json({success:false,message:error.message})
        }
    }
}

exports.sendPaymentSuccessEmail=async(req,res)=>{
    const {orderId,paymentId,amount}=req.body;
    const userId=req.user.id;
    if(!orderId || !paymentId || !amount || !userId){
        return res.status(400).json({
            success:false,
            message:"Please provide all the fields "
        })
    }

    try{
        // student ko dhundo
        const enrolledStudent=await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Payment Recieved`,
            paymentSuccessEmail(`${enrolledStudent.firstName}`,
            amount/100,orderId,paymentId)
        )
    }
    catch(error){
        console.log("error in sending email",error)
        return res.status(500).json({
            success:false,
            message:"Could not send email"
        })
    }
}


