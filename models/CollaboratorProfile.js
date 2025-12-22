const CollaboratorProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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

export const CollaboratorProfile = model(
  "CollaboratorProfile",
  CollaboratorProfileSchema
);
module.exports = { CollaboratorProfile };
