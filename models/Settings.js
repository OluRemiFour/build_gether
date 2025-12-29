const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  fullName: String,
  email: String,
  company: String,
  location: String,

  bio: String,
  skills: [
    {
      name: String,
      level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
    },
  ],
  availability: {
    type: String,
    enum: ["full-time", "part-time", "weekends", "flexible"],
  },
  experienceLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced", "expert"],
  },
  portfolioUrl: String,
  githubUrl: String,
  linkedinUrl: String,

  notification: {
    type: String,
    enum: ["email", "sms"],
    default: "email",
  },
});

module.exports = mongoose.model("Settings", settingSchema);
