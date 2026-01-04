const User = require("../models/User");

const getUser = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        statusCode: "01",
        message: "Not authenticated",
      });
    }

    const user = await User.findById(req.userId).select("-password"); // Don't send password

    if (!user) {
      return res.status(404).json({
        statusCode: "01",
        message: "User not found",
      });
    }

    return res.status(200).json({
      statusCode: "00",
      message: "User retrieved successfully",
      user: user,
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
