// Replace all tags by category 
const Section=require("../models/Section");
const Course=require("../models/Course");
const SubSection=require("../models/SubSection")
// creation of a section 
exports.createSection =async (req,res)=>{
    try{
        // data fetch
        const {sectionName,courseId}=req.body; 
        // data validation 
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:"Enter all the necessary fields "
            })
        }
        // create section 
        const newSection= await Section.create({sectionName});
        // update course with section ObjectID
        const updatedCourseDetails=await Course.findByIdAndUpdate(
                                                courseId,
                                                {
                                                    $push:{
                                                        courseContent:newSection._id,
                                                    }
                                                },
                                                {new:true},
        ).populate({
            path: 'courseContent', // First populate the courseContent (sections)
            populate: {
              path: 'subSection', // Then populate subsections inside each section
            },
          }).exec();
        console.log(updatedCourseDetails);
        // return response 
        return res.status(200).json({
            success:true,
            message:"Section create successfully",
            updatedCourseDetails,
        });
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Error in creation of section",
            error:error.message,
        })
    }
}


// updation of course 
exports.updateSection = async (req,res)=>{
    try{
        const {sectionName,sectionId,courseId}=req.body;
        if(!sectionName || !sectionId){
            return res.status(400).json({
                success:true,
                message:"Missing properties in the field "
            })
        }
        const section=await Section.findByIdAndUpdate(
            sectionId,
            {sectionName},
            {new:true},
        );
        const course = await Course.findById(courseId).populate({
            path: 'courseContent',
            populate: {
                path: 'subSection',
            },
        }).exec();
        
        return res.status(200).json({
            success:true,
            message:"Section updated successfully",
            data:course,
        });
    }
    catch(error){
        return res.status(500).json({
            success:true,
            messaege:"Section updation failed "
        });
    }
}

// deletion of course 
exports.deleteSection = async (req, res) => {
	try {

		const { sectionId, courseId }  = req.body;
		await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId,
			}
		})
		const section = await Section.findById(sectionId);
		console.log(sectionId, courseId);
		if(!section) {
			return res.status(404).json({
				success:false,
				message:"Section not Found",
			})
		}

		//delete sub section
		await SubSection.deleteMany({_id: {$in: section.subSection}});

		await Section.findByIdAndDelete(sectionId);

		//find the updated course and return 
		const course = await Course.findById(courseId).populate({
			path:"courseContent",
			populate: {
				path: "subSection"
			}
		})
		.exec();

		res.status(200).json({
			success:true,
			message:"Section deleted",
			data:course
		});
	} catch (error) {
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};   