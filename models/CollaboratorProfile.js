const { default: mongoose } = require("mongoose");

const CollaboratorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: String,
    email: String,
    bio: String,
    location: String,
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
  },
  { timestamps: true }
);

const CollaboratorProfile = mongoose.model(
  "CollaboratorProfile",
  CollaboratorProfileSchema
);
module.exports = { CollaboratorProfile };
