import { getTime } from "date-fns";

const ProjectOwnerProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    company: String,
    role: String,
    email: String,
    bio: String,
    location: String,
    projectsPosted: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    websiteUrl: String,
    linkedinUrl: String,
    twitterUrl: String,
    githubUrl: String,
  },
  { timestamps: true }
);

export const ProjectOwnerProfile = model(
  "ProjectOwnerProfile",
  ProjectOwnerProfileSchema
);
// module.exports = { ProjectOwnerProfile };
