const express = require("express");
const { protect, authorize } = require("../middleware/auth.js");

const {
  createProject,
  getTotalProjects,
  getActiveProjects,
  getAchProjects,
  getDraftProjects,
  completedProjects,
  deleteProject,
  archiveProject,
  applyToProject,
  inviteCollaborator,
  getAllProjects,
  getAllApplicants,
  getProjectById,
  getApplicantById,
  getMyProjects,
  getOwnerDashboardStats,
  updateProject
} = require("../controllers/projectController.js");
const router = express.Router();
// Project Routes

router.put(
    "/:projectId",
    protect,
    authorize("project_owner"),
    updateProject
);
router.post(
  "/create-project",
  protect,
  authorize("project_owner"),
  createProject
);
router.get(
  "/total-projects",
  protect,
  authorize("project_owner"),
  getTotalProjects
);
router.get(
  "/active-projects",
  protect,
  authorize("project_owner"),
  getActiveProjects
);
router.get(
  "/completed-projects",
  protect,
  authorize("project_owner", "collaborator"),
  completedProjects
);
router.get(
  "/achieved-projects",
  protect,
  authorize("project_owner"),
  getAchProjects
);
router.get(
  "/draft-projects",
  protect,
  authorize("project_owner"),
  getDraftProjects
);
router.delete(
  "/:projectId",
  protect,
  authorize("project_owner"),
  deleteProject
);
router.put(
  "/archive-projects/:projectId",
  protect,
  authorize("project_owner"),
  archiveProject
);
router.post(
  "/projects/:projectId/apply",
  protect,
  authorize("collaborator"),
  applyToProject
);
router.post(
  "/projects/:projectId/invite",
  protect,
  authorize("project_owner"),
  inviteCollaborator
);

// New Routes for Discovery and Applicants
router.get(
    "/explore",
    // Public or protected? Let's make it protected for now as generic user
    protect, 
    getAllProjects
);

router.get(
    "/applicants",
    protect,
    authorize("project_owner"),
    getAllApplicants
);

router.get(
    "/details/:projectId",
    protect,
    getProjectById
);

router.get(
    "/application/:applicationId",
    protect, 
    authorize("project_owner"),
    getApplicantById
);

router.get(
    "/my-projects",
    protect,
    getMyProjects
);

router.get(
    "/owner-stats",
    protect,
    authorize("project_owner"),
    getOwnerDashboardStats
);

module.exports = router;
