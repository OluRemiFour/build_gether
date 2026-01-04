// controllers/userController.js
const getUser = async (req, res) => {
  try {
    // req.user is already attached by the protect middleware
    if (!req.user) {
      return res.status(401).json({
        statusCode: "01",
        message: "Not authenticated",
      });
    }

    return res.status(200).json({
      statusCode: "00",
      message: "User retrieved successfully",
      user: req.user,
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
