const mongoose = require("mongoose");
const Applicant = require("../models/Applicant");
const Project = require("../models/CreateProject");
const Notification = require("../models/Notification");

const getAllApplicants = async (req, res) => {
  try {
    const ownerId = req.user.userId;

    const applicants = await Applicant.find()
      .populate({
        path: "projectId",
        match: { owner: ownerId },
        select: "projectTitle owner",
      })
      .populate("collaboratorId", "fullName email role");

    // Remove applicants whose project does not belong to owner
    const filteredApplicants = applicants.filter(
      (app) => app.projectId !== null
    );

    res.status(200).json({
      message: "Applicants fetched successfully",
      totalApplicants: filteredApplicants.length,
      applicants: filteredApplicants,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSingleApplicant = async (req, res) => {
  try {
    const applicantId = req.params.applicantId;
    const applicant = await Applicant.findById(applicantId)
      .populate("collaboratorId", "fullName email role")
      .populate("projectId", "projectTitle owner");
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }
    res
      .status(200)
      .json({ message: "Applicant fetched successfully", applicant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getApplicantStats = async (req, res) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user.userId);

    const stats = await Applicant.aggregate([
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
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      message: "Applicant stats fetched successfully",
      stats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRejectedApplicants = async (req, res) => {
  try {
    const rejectedApplicants = await Applicant.find({ status: "rejected" })
      .populate("collaboratorId")
      .populate("projectId");
    res.status(200).json({
      message: "Rejected applicants fetched successfully",
      rejectedApplicants,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rejectApplicant = async (req, res) => {
  try {
    const { applicantId } = req.params;

    // Find project containing this applicant subdocument
    const project = await Project.findOne({ "applicants._id": applicantId });
    if (!project) {
      return res.status(404).json({ message: "Application not found" });
    }

    const applicant = project.applicants.id(applicantId);
    if (!applicant) {
        return res.status(404).json({ message: "Applicant not found" });
    }

    applicant.status = "rejected";
    await project.save();

    res.status(200).json({ message: "Applicant rejected", applicant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptApplicant = async (req, res) => {
  try {
    const { projectId, applicantId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const applicant = project.applicants.id(applicantId);
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    applicant.status = "accepted";
    if (!project.collaborators.some(c => c.toString() === applicant.user.toString())) {
      project.collaborators.push(applicant.user);
    }

    // Fix: Also add to team if not already present
    // This allows access (isMember=true) even if accepted after lifecycle transition checks
    const alreadyInTeam = project.team.some(tm => tm.user.toString() === applicant.user.toString());
    if (!alreadyInTeam) {
        project.team.push({
            user: applicant.user,
            role: applicant.roleAppliedFor || "Collaborator",
            joinedAt: new Date()
        });
    }

    await project.save();

    // Create notification for applicant
    await Notification.create({
        recipient: applicant.user,
        sender: req.userId || req.user?._id,
        type: "acceptance",
        project: projectId,
        text: `Congratulations! Your application for "${project.projectTitle}" has been accepted.`
    });

    res.status(200).json({ 
        message: "Applicant accepted and added to team", 
        applicant 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const acceptInvite = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    const invite = project.invites.find(
      (i) => i.user.toString() === userId.toString()
    );

    if (!invite) return res.status(404).json({ message: "Invite not found" });

    if (invite.status !== "pending") {
      return res.status(400).json({ message: "Invite already processed" });
    }

    invite.status = "accepted";

    // Add to collaborators
    project.collaborators.push(userId);

    await project.save();

    res.json({ message: "Invite accepted. You are now a collaborator." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const rejectInvite = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    const project = await Project.findById(projectId);

    const invite = project.invites.find(
      (i) => i.user.toString() === userId.toString()
    );

    if (!invite) return res.status(404).json({ message: "Invite not found" });

    invite.status = "rejected";

    await project.save();

    res.json({ message: "Invite rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllApplicants,
  // getPendingApplicants,
  // getAcceptedApplicants,
  getRejectedApplicants,
  getSingleApplicant,
  acceptApplicant,
  getApplicantStats,
  rejectApplicant,
  acceptInvite,
  rejectInvite,
};
