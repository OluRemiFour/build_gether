const express = require("express");
const {
  login,
  getProfile,
  register,
  verifyOtp,
  resendOtp,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.get("/profile", protect, getProfile);

module.exports = router;
