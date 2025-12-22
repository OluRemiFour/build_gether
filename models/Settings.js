const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    unique: true,
  },

  phoneNumber: String,
  address: String,

  guardianName: String,
  guardianNumber: String,
  guardianAddress: String,

  notification: {
    type: String,
    enum: ["email", "sms"],
    default: "email",
  },
});

module.exports = mongoose.model("Settings", settingSchema);
