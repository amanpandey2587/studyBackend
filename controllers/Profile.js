const Profile = require("../models/Profile");
const User = require("../models/User");
const Course=require("../models/Course")
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration")
const CourseProgress=require("../models/CourseProgress")
// Method for updating a profile
exports.updateProfile = async (req, res) => {
	try {
		const { dateOfBirth = "", about = "", contactNumber } = req.body;
		const id = req.user.id;

		// Find the profile by id
		const userDetails = await User.findById(id);
		const profile = await Profile.findById(userDetails.additionalDetails);

		// Update the profile fields
		profile.dateOfBirth = dateOfBirth;
		profile.about = about;
		profile.contactNumber = contactNumber;

		// Save the updated profile
		await profile.save();

		return res.json({
			success: true,
			message: "Profile updated successfully",
			profile,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

exports.deleteAccount = async (req, res) => {
	try {
		// TODO: Find More on Job Schedule
		// const job = schedule.scheduleJob("10 * * * * *", function () {
		// 	console.log("The answer to life, the universe, and everything!");
		// });
		// console.log(job);
		console.log("Printing ID: ", req.user.id);
		const id = req.user.id;
		
		const user = await User.findById({ _id: id });
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}
		// Delete Assosiated Profile with the User
		await Profile.findByIdAndDelete({ _id: user.additionalDetails });
		// TODO: Unenroll User From All the Enrolled Courses
		// Now Delete User
		await User.findByIdAndDelete({ _id: id });
		res.status(200).json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (error) {
		console.log(error);
		res
			.status(500)
			.json({ success: false, message: "User Cannot be deleted successfully" });
	}
};

exports.getAllUserDetails = async (req, res) => {
	try {
		const id = req.user.id;
		const userDetails = await User.findById(id)
			.populate("additionalDetails")
			.exec();
		console.log(userDetails);
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: userDetails,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};
  
exports.getEnrolledCourses = async (req, res) => {
	try {
	  const userId = req.user.id;
	  console.log("userId is", userId);
  
	  // Fetch user details with course, content, and subsection population
	  const userDetails = await User.findOne({ _id: userId })
		.populate({
		  path: "courses",
		  populate: {
			path: "courseContent",
			populate: {
			  path: "subSection",
			},
		  },
		})
		.lean(); // Use lean() for better performance if we don't need Mongoose document methods
  
	  if (!userDetails) {
		return res.status(404).json({
		  success: false,
		  message: `User not found with ID: ${userId}`,
		});
	  }
  
	  // Loop through each course to calculate additional details
	  for (const course of userDetails.courses) {
		let totalDurationInSeconds = 0;
		let subSectionCount = 0;
  
		// Calculate total duration and subsection count
		course.courseContent.forEach((section) => {
		  totalDurationInSeconds += section.subSection.reduce(
			(acc, subSection) => acc + parseInt(subSection.timeDuration || 0),
			0
		  );
		  subSectionCount += section.subSection.length;
		});
  
		// Convert total duration to human-readable format
		course.totalDuration = convertSecondsToDuration(totalDurationInSeconds);
  
		// Fetch course progress for this user and course
		const courseProgress = await CourseProgress.findOne({
		  courseID: course._id,
		  userId: userId,
		}).lean();
  
		const completedVideos = courseProgress?.completedVideos || [];
		course.completedVideos = completedVideos; // Include completed videos in the response
  
		// Calculate progress percentage
		if (subSectionCount === 0) {
		  course.progressPercentage = 100; // No subsections, course considered complete
		} else {
		  const progressPercentage = (completedVideos.length / subSectionCount) * 100;
		  course.progressPercentage = Math.round(progressPercentage * 100) / 100; // Round to 2 decimal places
		}
	  }
  
	  // Respond with the enriched course data
	  return res.status(200).json({
		success: true,
		data: userDetails.courses,
	  });
	} catch (error) {
	  console.error("Error in getEnrolledCourses:", error.message);
	  return res.status(500).json({
		success: false,
		message: "Internal Server Error",
		error: error.message,
	  });
	}
};

exports.instructorDashboard=async(req,res)=>{
	try{
		console.log("ENtering the instructor dashboard function");
		const courseDetails=await Course.find({
			instructor:req.user.id
		}) 
		const courseData=courseDetails.map((course)=>{
			const totalStudentsEnrolled=course.studentsEnrolled.length
			const totalAmountGenerated=totalStudentsEnrolled*course.price

			// new object with the additional fields 
			const courseDataWithStats={
				_id:course._id,
				courseName:course.courseName,
				courseDescription:course.courseDescription,
				totalStudentsEnrolled,
				totalAmountGenerated,
			}
			return courseDataWithStats
		})
		res.status(200).json({
			courses:courseData 
		})
	}catch(error){
		console.error(error)
		res.status(500).json({
			message:"Server Error"
		})
	}
}