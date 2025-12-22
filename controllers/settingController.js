const Settings = require("../models/Settings");
const Student = require("../models/Student");

const personalInfo = async (req, res) => {
  const {
    phoneNumber,
    address,
    guardianName,
    guardianNumber,
    guardianAddress,
  } = req.body;

  try {
    if (
      !phoneNumber ||
      !address ||
      !guardianName ||
      !guardianNumber ||
      !guardianAddress
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: "Failed" });
    }

    const setting = await Settings.findOneAndUpdate(
      { student: req.userId },
      {
        phoneNumber,
        address,
        guardianName,
        guardianNumber,
        guardianAddress,
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Personal info updated successfully!",
      statusCode: "00",
      data: setting,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const notification = async (req, res) => {
  const { preference } = req.body; // "email" or "sms"

  if (!["email", "sms"].includes(preference)) {
    return res.status(400).json({
      message: "Invalid notification type",
      status: "Failed",
    });
  }

  try {
    const setting = await Settings.findOneAndUpdate(
      { student: req.userId },
      { notification: preference },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Notification updated successfully!",
      statusCode: "00",
      data: setting,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  personalInfo,
  notification,
};
