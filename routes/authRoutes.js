const express = require("express");
const {
  login,
  getProfile,
  updateProfile,
  register,
  verifyOtp,
  resendOtp,
  getProfileStatus,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
// Alias for request-otp to resendOtp
router.post("/request-otp", resendOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.get("/profile", protect, getProfile);
router.get("/profile/status", protect, getProfileStatus);
router.put("/profile", protect, updateProfile);

module.exports = router;
