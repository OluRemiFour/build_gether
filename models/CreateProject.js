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
    enum: ["all", "active", "completed", "on-hold", "cancelled", "draft", 'archived'],
    default: "active",
  },
  lifecycleStage: {
    type: String,
    enum: ["initiation", "team-search", "ongoing", "review", "completed"],
    default: "team-search",
  },
  team: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      role: String,
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    }
  ],
  applicants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      roleAppliedFor: String,
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      appliedAt: {
        type: Date,
        default: Date.now,
      },
      message: String,
    },
  ],

  collaborators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  invites: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      invitedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  views: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
