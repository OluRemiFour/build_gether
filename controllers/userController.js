const User = require("../models/User");

const getUser = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        statusCode: "01",
        message: "Not authenticated",
      });
    }

    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        statusCode: "01",
        message: "User not found",
      });
    }

    let profile = null;
    const { CollaboratorProfile } = require("../models/CollaboratorProfile");
    const { ProjectOwnerProfile } = require("../models/ProjectOwnerProfile");

    if (user.role === "collaborator") {
      profile = await CollaboratorProfile.findOne({ userId: user._id });
    } else if (user.role === "project_owner") {
      profile = await ProjectOwnerProfile.findOne({ userId: user._id });
    }

    // Merge profile data into user object for frontend convenience
    const userWithProfile = user.toObject();
    if (profile) {
      const profileObj = profile.toObject();
      // Merge keys while avoiding overwriting ID if possible, though they map to same user
      Object.assign(userWithProfile, profileObj);
    }

    return res.status(200).json({
      statusCode: "00",
      message: "User retrieved successfully",
      user: userWithProfile,
    });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({
      statusCode: "01",
      message: "Server error while fetching user",
      error: error.message,
    });
  }
};

module.exports = {
  getUser,
};
