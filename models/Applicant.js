import { Schema, model } from "mongoose";

const ApplicantSchema = new Schema(
  {
    aboutMe: {
      type: String,
      required: true,
      maxLength: 2000,
    },
    experience: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      required: true,
    },
    githubProfile: {
      type: String,
    },
    linkedinProfile: {
      type: String,
    },
    websiteUrl: {
      type: String,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    collaboratorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
    message: {
      type: String,
      maxLength: 1000,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);
