const express = require("express");
const { protect, authorize } = require("../middleware/auth.js");

const {
  getAllApplicants,
  getPendingApplicants,
  getAcceptedApplicants,
  getApplicantStats,
  getRejectedApplicants,
  acceptApplicant,
  rejectApplicant,
  acceptInvite,
  rejectInvite,
} = require("../controllers/applicantController.js");
const router = express.Router();
router.get(
  "/applicants",
  protect,
  authorize("project_owner"),
  getAllApplicants
);
// router.get(
//   "/applicants-pending",
//   protect,
//   authorize("project_owner"),
//   getPendingApplicants
// );
router.get(
  "/applicants-stats",
  protect,
  authorize("project_owner"),
  getApplicantStats
);
router.get(
  "/applicants-rejected",
  protect,
  authorize("project_owner"),
  getRejectedApplicants
);
router.put(
  "/reject-applicants/:applicantId",
  protect,
  authorize("project_owner"),
  rejectApplicant
);
router.patch(
  "/projects/:projectId/applicants/:applicantId/accept",
  authorize("project_owner"),
  acceptApplicant
);
router.patch(
  "/projects/:projectId/invite/accept",
  authorize("collaborator"),
  acceptInvite
);
router.patch(
  "/projects/:projectId/invite/reject",
  authorize("collaborator"),
  rejectInvite
);
module.exports = router;
