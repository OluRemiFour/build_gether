const { default: mongoose } = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectTitle: {
    type: String,
    required: true,
  },
  projectDescription: {
    type: String,
    required: true,
  },
  rolesNeeded: {
    type: [String],
    required: true,
  },

  projectDetails: {
    experienceLevel: {
      type: String,
      required: true,
    },
    timeline: {
      type: String,
      required: true,
    },
    teamSize: {
      type: Number,
      required: true,
    },
  },

  techStack: {
    type: [String],
    required: true,
  },
  projectStatus: {
    type: String,
    enum: ["all", "active", "completed", "on-hold", "cancelled", "draft"],
    default: "active",
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Applicant",
    required: true,
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  collaborators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
