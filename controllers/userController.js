const User = require("../models/User.js");

const getUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(404).json({
        statusCode: "01",
        status: "Failed",
        message: "Invalid credentials",
      });
    }
    const user = await User.find({ email, password });
    if (user && user.length > 0) {
      return res.status(200).json({
        statusCode: "00",
        message: "User found sucessfully!",
        data: user,
      });
    } else {
      return res.status(404).json({
        statusCode: "01",
        message: "User not found, kindly procced to registration",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUser,
};
