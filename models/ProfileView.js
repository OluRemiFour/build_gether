const mongoose = require("mongoose");

const profileViewSchema = new mongoose.Schema(
  {
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    viewedApplicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // project owner
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProfileView", profileViewSchema);
