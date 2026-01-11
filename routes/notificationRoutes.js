const express = require("express");
const { protect } = require("../middleware/auth.js");
const {
  getNotifications,
  markAsRead,
} = require("../controllers/notificationController.js");

const router = express.Router();

router.get("/", protect, getNotifications);
router.patch("/:notificationId/read", protect, markAsRead);

module.exports = router;
