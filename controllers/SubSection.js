const SubSection =require("../models/SubSection");
const Section=require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");


// create subsection 
exports.createSubSection= async (req,res)=>{
    try{
        //data fetching 
        const {sectionId,title,description}=req.body;
        console.log("values from request body is ",sectionId,title,description);
        // extract video link from file 
        const video = req.files.video;
        console.log("VideoFiles is ",req.files);
        console.log("Video url is ",video);
        // Validation 
        if(!sectionId || !title || !description || !video){
            return res.status(404).json({
                success:false,
                message:"Enter all the required fields ",
            });
        }
        console.log(video)
        // Upload video to cloudinary 
        const uploadDetails= await uploadImageToCloudinary(video,process.env.FOLDER_NAME);
        console.log("uploaded details is ",uploadDetails)
        // create subsection 
        const SubSectionDetails=await SubSection.create({
            title:title,
            // timeDuration:timeDuration,
            description:description,
            videoUrl:uploadDetails.secure_url,

        })
        // push subsectionId to section 
        const updatedSection=await Section.findByIdAndUpdate(
                                                {_id:sectionId},
                                                {$push:{
                                                    subSection:SubSectionDetails._id,
                                                }},
                                                {new:true},
                                                ).populate("subSection").exec();
        console.log("Updated values in section ",updatedSection);
        // return response 
        return res.status(200).json({
            // console.log("subSection created successfully"),
            success:true,
            message:"Subsection created successfully ",
            data:updatedSection,
        })
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Error in creation subsection",
            error:error.message,
        })
    }
}

// update subsection 
exports.updateSubSection = async (req, res) => {
    try {
      console.log("Entering update subsection");
      const { sectionId,subSectionId, title, description } = req.body
      console.log(sectionId,subSectionId,title,description);
      const subSection = await SubSection.findById(subSectionId)
      console.log("subsevtiopn is",subSection)
      if (!subSection) {
        return res.status(404).json({
          success: false,
          message: "SubSection not found",
        })
      }
  
      if (title !== undefined) {
        subSection.title = title
      }
  
      if (description !== undefined) {
        subSection.description = description
      }
      if (req.files && req.files.video !== undefined) {
        const video = req.files.video
        const uploadDetails = await uploadImageToCloudinary(
          video,
          process.env.FOLDER_NAME
        )
        subSection.videoUrl = uploadDetails.secure_url
        subSection.timeDuration = `${uploadDetails.duration}`
      }
      await subSection.save()

      const updatedSection=await Section.findById(sectionId).populate("subSection");
      console.log(updatedSection)
      return res.json({
        success: true,
        data:updatedSection,
        message: "Section updated successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
  }
  
// delete subsection 
exports.deleteSubSection = async (req, res) => {
  try {
      // Data fetch
      const { subSectionId, sectionId } = req.body;

      // Data validation
      if (!sectionId || !subSectionId) {
          return res.status(400).json({
              success: false,
              message: "Enter subSectionId and sectionId to delete subsection",
          });
      }

      // Deletion from SubSection
      const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);
      if (!deletedSubSection) {
          return res.status(404).json({
              success: false,
              message: "Subsection not found",
          });
      }

      // Removing the subSectionId from the Section document
      const updateSection = await Section.findByIdAndUpdate(
          sectionId,
          { $pull: { subSection: subSectionId } },
          { new: true }
      );

      if (!updateSection) {
          return res.status(404).json({
              success: false,
              message: "Section not found",
          });
      }
      console.log(updateSection);
      // Successful response
      return res.status(200).json({
          success: true,
          data: updateSection,
          
          message: "Subsection deleted successfully and section updated",
      });
  } catch (error) {
      console.error("Error in deletion of subsection:", error.message); // Log the specific error
      return res.status(500).json({
          success: false,
          message: "Error in deletion of subsection",
          error: error.message, // Include detailed error in response for debugging
      });
  }
};

