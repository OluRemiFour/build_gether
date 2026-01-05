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
      applicant,
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
    const _id = ownerExists.map((o) => o._id.toString());
    if (_id[0] !== owner) {
      return res.status(400).json({ message: "Invalid owner ID provided" });
    }

    const applicantId = await Applicant.findOne({ _id: applicant });
    if (applicant && !applicantId) {
      return res.status(400).json({ message: "Invalid applicant ID provided" });
    }

    const newProject = new Project({
      projectTitle,
      projectDescription,
      rolesNeeded,
      projectDetails,
      techStack,
      owner: _id[0],
    });
    if (applicantId) newProject.applicants = applicantId;
    await newProject.save();
    res
      .status(201)
      .json({ message: "Project created successfully", newProject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const Project = require("../models/Project");
const User = require("../models/User");

const getTotalProjects = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const projects = await Project.find({ userId });

    res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      data: {
        projects,
        total: projects.length,
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};
const getActiveProjects = async (req, res) => {
  try {
    const { owner } = req.user.userId;
    const activeProject = await Project.find({
      projectStatus: "active",
      owner,
    });
    res.status(200).json({
      message: "Active projects fetched successfully",
      activeProject,
      total: activeProject.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getAchProjects = async (req, res) => {
  try {
    const owner = req.user.userId;
    const achProjects = await Project.find({
      projectStatus: "achieved",
      owner,
    });
    res.status(200).json({
      message: "Achieved projects fetched successfully",
      achProjects,
      total: achProjects.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDraftProjects = async (req, res) => {
  try {
    const owner = req.user.userId;
    const draftProject = await Project.find({
      projectStatus: "draft",
      owner,
    });
    res.status(200).json({
      message: "Draft projects fetched successfully",
      draftProject,
      total: draftProject.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const completedProjects = async (req, res) => {
  try {
    const owner = req.user.userId;
    const completedProjects = await Project.find({
      projectStatus: "completed",
      owner,
    });
    res.status(200).json({
      message: "Completed projects fetched successfully",
      completedProjects,
      total: completedProjects.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const archiveProject = async (req, res) => {
  const owner = req.user.userId;
  const projectId = req.params.projectId;
  try {
    const archiveProject = await Project.findById({ _id: projectId, owner });
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
  const owner = req.user.userId;
  try {
    const projectToRemove = await Project.findById({ _id: projectId, owner });
    if (!projectToRemove) {
      return res.status(404).json({ message: "Project not found" });
    }
    await Project.findByIdAndDelete(projectId);
    res.status(200).json({ message: "Project removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const applyToProject = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user_id;
  const { roleAppliedFor } = req.body;

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const alreadyApplied = project.applicants.some(
    (a) => a.user.toString() === userId.toString()
  );

  if (alreadyApplied) {
    return res.status(400).json({ message: "Already applied" });
  }

  project.applicants.push({
    user: userId,
    roleAppliedFor,
  });

  await project.save();

  res.status(200).json({ message: "Application submitted" });
};
const inviteCollaborator = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body;
    const ownerId = req.user._id;

    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only owner can invite
    if (project.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Already collaborator?
    if (project.collaborators.includes(userId)) {
      return res.status(400).json({ message: "User already a collaborator" });
    }

    // Already invited?
    const alreadyInvited = project.invites.some(
      (i) => i.user.toString() === userId && i.status === "pending"
    );

    if (alreadyInvited) {
      return res.status(400).json({ message: "User already invited" });
    }

    project.invites.push({ user: userId });

    await project.save();

    res.status(200).json({ message: "Invite sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
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
  applyToProject,
  inviteCollaborator,
};
