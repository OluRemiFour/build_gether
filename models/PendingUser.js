const { default: mongoose } = require("mongoose");

const PendingUserSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["project_owner", "collaborator"],
  },
  otp: Number,
  otpExpires: Date,
});

module.exports = mongoose.model("PendingUser", PendingUserSchema);
