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
} = require("../controllers/projectController.js");
const router = express.Router();
// Project Routes
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
  "/:projectId-delete",
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

module.exports = router;
