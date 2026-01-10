const express = require("express");
const { protect, authorize } = require("../middleware/auth.js");
const {
  getMatches,
  getApplications,
  getDashboardStats
} = require("../controllers/collaboratorController.js");

const router = express.Router();

router.get("/matches", protect, authorize("collaborator"), getMatches);
router.get("/applications", protect, authorize("collaborator"), getApplications);
router.get("/stats", protect, authorize("collaborator"), getDashboardStats);

module.exports = router;
