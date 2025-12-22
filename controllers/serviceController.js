const Applicant = require("../models/Applicant");
const Project = require("../models/CreateProject");
const User = require("../models/User");

const createProject = async (req, res) => {
  try {
    const {
      projectTitle,
      projectDescription,
      rolesNeeded,
      projectDetails,
      techStack,
      owner,
    } = req.body;
    if (
      !projectTitle ||
      !projectDescription ||
      !rolesNeeded ||
      !techStack ||
      !projectDetails.experienceLevel ||
      !projectDetails.timeline ||
      !projectDetails.teamSize ||
      !owner
    ) {
      return res.status(400).json({
        message:
          "Project title, Project Description, Roles, Project Details, Project Stack are required",
      });
    }

    // Check if owner IDs exist
    const ownerExists = await User.find({ _id: { $in: req.userId } });
    if (ownerExists.length !== owner.length) {
      return res.status(400).json({ message: "Invalid owner ID(s) provided" });
    }

    const newProject = new Project({
      projectTitle,
      projectDescription,
      rolesNeeded,
      projectDetails,
      techStack,
      owner: req.userId,
    });

    await newProject.save();
    res
      .status(201)
      .json({ message: "Project created successfully", newProject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getTotalProjects = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const ttProject = await Project.find();
    res
      .status(200)
      .json({ message: "Total projects fetched successfully", totalProjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getActiveProjects = async (req, res) => {
  try {
    const activeProjects = await Project.countDocuments({
      projectStatus: "active",
    });
    res.status(200).json({
      message: "Active projects fetched successfully",
      activeProjects,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getAchProjects = async (req, res) => {
  try {
    const achProjects = await Project.countDocuments({
      projectStatus: "achieved",
    });
    res.status(200).json({
      message: "Achieved projects fetched successfully",
      achProjects,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDraftProjects = async (req, res) => {
  try {
    const draftProject = await Project.countDocuments({
      projectStatus: "draft",
    });
    res.status(200).json({
      message: "Draft projects fetched successfully",
      draftProject,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const completedProjects = async (req, res) => {
  try {
    const completedProjects = await Project.countDocuments({
      projectStatus: "completed",
    });
    res.status(200).json({
      message: "Completed projects fetched successfully",
      completedProjects,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const archiveProject = async (req, res) => {
  const projectId = req.params.projectId;
  try {
    const archiveProject = await Project.findById(req.params.projectId);
    if (!archiveProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    archiveProject.projectStatus = "archived";
    await archiveProject.save();
    res
      .status(200)
      .json({ message: "Project archived successfully", archiveProject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteProject = async (req, res) => {
  const projectId = req.params.projectId;
  try {
    const projectToRemove = await Project.findById(projectId);
    if (!projectToRemove) {
      return res.status(404).json({ message: "Project not found" });
    }
    await Project.findByIdAndDelete(projectId);
    res.status(200).json({ message: "Project removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Applicant Controllers
const getAllApplicants = async (req, res) => {
  try {
    const applicants = await Applicant.find()
      .populate("collaboratorId")
      .populate("projectId");
    res
      .status(200)
      .json({ message: "Applicants fetched successfully", applicants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getPendingApplicants = async (req, res) => {
  try {
    const pendingApplicants = await Applicant.find({ status: "pending" })
      .populate("collaboratorId")
      .populate("projectId");
    res.status(200).json({
      message: "Pending applicants fetched successfully",
      pendingApplicants,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getAcceptedApplicants = async (req, res) => {
  try {
    const acceptedApplicants = await Applicant.find({ status: "accepted" })
      .populate("collaboratorId")
      .populate("projectId");
    res.status(200).json({
      message: "Accepted applicants fetched successfully",
      acceptedApplicants,
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
const acceptApplicant = async (req, res) => {
  try {
    const applicantId = req.params.applicantId;
    try {
      const applicant = await Applicant.findById(applicantId);
      if (!applicant) {
        return res.status(404).json({ message: "Applicant not found" });
      }
      applicant.status = "accepted";
      await applicant.save();
      res
        .status(200)
        .json({ message: "Applicant accepted successfully", applicant });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } catch (error) {}
};
const rejectApplicant = async (req, res) => {
  try {
    const applicantId = req.params.applicantId;
    try {
      const applicant = await Applicant.findById(applicantId);
      if (!applicant) {
        return res.status(404).json({ message: "Applicant not found" });
      }
      applicant.status = "rejected";
      await applicant.save();
      res
        .status(200)
        .json({ message: "Applicant rejected successfully", applicant });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } catch (error) {}
};

module.exports = {
  createProject,
  getTotalProjects,
  getActiveProjects,
  deleteProject,
  completedProjects,
  getAchProjects,
  getDraftProjects,
  archiveProject,

  // Applicant Exports
  getAllApplicants,
  getPendingApplicants,
  getAcceptedApplicants,
  getRejectedApplicants,
  acceptApplicant,
  rejectApplicant,
};
