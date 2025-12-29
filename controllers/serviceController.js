const mongoose = require("mongoose");
const Project = require("../models/CreateProject");
const User = require("../models/User");
const Applicant = require("../models/Applicant");
const ProfileView = require("../models/ProfileView");

const matchScore = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId)
      return res.status(400).json({ message: "User ID is required" });

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const projects = await Project.find({ projectStatus: "active" });

    let matchedProjects = [];

    for (let project of projects) {
      let score = 0;

      // 1️⃣ Role match (30 points)
      if (project.rolesNeeded.includes(user.role)) {
        score += 30;
      }

      // 2️⃣ Skill match (10 points per skill)
      const commonSkills = user.skills.filter((skill) =>
        project.techStack.includes(skill)
      );
      score += commonSkills.length * 10;

      // 3️⃣ Experience level match (20 points)
      if (user.experienceLevel === project.projectDetails.experienceLevel) {
        score += 20;
      }

      // 4️⃣ Team size preference (optional)
      if (user.preferredTeamSize === project.projectDetails.teamSize) {
        score += 10;
      }

      // Only keep good matches
      if (score >= 50) {
        matchedProjects.push({
          project,
          score,
          matchedSkills: commonSkills,
        });
      }
    }

    // Sort best matches first
    matchedProjects.sort((a, b) => b.score - a.score);

    return res.status(200).json({
      message: "Matched projects retrieved successfully",
      count: matchedProjects.length,
      data: matchedProjects,
    });
  } catch (error) {
    console.error("MATCH SCORE ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

const getSuccessfulMatches = async (req, res) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user.userId);

    const result = await Applicant.aggregate([
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: "$project" },
      {
        $match: {
          "project.owner": ownerId,
          status: "accepted",
        },
      },
      {
        $group: {
          _id: null,
          totalSuccessfulMatches: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      totalSuccessfulMatches: result[0]?.totalSuccessfulMatches || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logProfileView = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { applicantId, projectId } = req.body;

    await ProfileView.create({
      viewer: ownerId,
      viewedApplicant: applicantId,
      project: projectId,
      owner: ownerId,
    });

    res.status(200).json({ message: "Profile view logged" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTotalProfileViews = async (req, res) => {
  try {
    const ownerId = req.user.userId;

    const totalViews = await ProfileView.countDocuments({
      owner: ownerId,
    });

    res.status(200).json({
      totalProfileViews: totalViews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getRecentApplicants = async (req, res) => {
  try {
    const ownerId = req.user.userId;

    const applicants = await Applicant.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: "projectId",
        match: { owner: ownerId },
        select: "projectTitle",
      })
      .populate("collaboratorId", "fullName email");

    const filtered = applicants.filter((app) => app.projectId !== null);

    res.json({ recentApplicants: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  matchScore,
  getSuccessfulMatches,
  logProfileView,
  getTotalProfileViews,
  getRecentApplicants,
};
