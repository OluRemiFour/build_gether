require("dotenv").config();
const User = require("../models/User.js");
const jwt = require("jsonwebtoken");
const {
  validateEmail,
  validatePassword,
} = require("../middleware/validation.js");
const { transporter, sendOtpEmail } = require("../middleware/sendEmail.js");
const { CollaboratorProfile } = require("../models/CollaboratorProfile.js");
const PendingUser = require("../models/PendingUser.js");
const { ProjectOwnerProfile } = require("../models/ProjectOwnerProfile.js");

const generateToken = (userId, role, product_type) => {
  return jwt.sign({ userId, role, product_type }, process.env.JWT_SECRET, {
    expiresIn: "24hrs",
  });
};

const register = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, role } = req.body;

    const allowedRoles = ["project_owner", "collaborator"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Already registered?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Prevent duplicate pending registration
    await PendingUser.deleteOne({ email });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 10 * 60 * 1000;

    await PendingUser.create({
      fullName,
      email,
      password,
      role,
      otp,
      otpExpires,
    });

    await sendOtpEmail(email, fullName, otp);

    return res.status(200).json({
      message: "OTP sent. Please verify your email.",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find pending registration
    const pendingUser = await PendingUser.findOne({ email });

    if (!pendingUser) {
      return res.status(404).json({ message: "No pending registration found" });
    }

    // OTP checks
    if (pendingUser.otp !== Number(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (pendingUser.otpExpires < Date.now()) {
      await PendingUser.deleteOne({ email });
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Create verified user
    const user = await User.create({
      fullName: pendingUser.fullName,
      email: pendingUser.email,
      password: pendingUser.password,
      role: pendingUser.role,
      isVerified: true,
    });

    // Create profile AFTER user exists
    if (user.role === "project_owner") {
      await ProjectOwnerProfile.create({
        userId: user._id,
        name: user.fullName,
        email: user.email,
        bio: "",
        location: "",
        company: "",
        portfolioUrl: "",
        githubUrl: "",
        linkedinUrl: "",
      });
    } else if (user.role === "collaborator") {
      await CollaboratorProfile.create({
        userId: user._id,
        name: user.fullName,
        email: user.email,
        bio: "",
        location: "",
        skills: [],
        availability: [],
        experienceLevel: [],
        portfolioUrl: "",
        githubUrl: "",
        linkedinUrl: "",
      });
    }

    // Cleanup pending data
    await PendingUser.deleteOne({ email });

    return res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ message: "Account already verified" });

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 15 * 60 * 1000;

    user.otp = newOtp;
    user.otpExpires = otpExpires;

    await user.save();

    // SEND OTP VIA EMAIL
    await transporter.sendMail({
      from: `"Build Gether" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Your New Verification Code",
      html: `
        <h2>Hello ${user.fullName},</h2>
        <p>Your new One-Time Password (OTP) for email verification is:</p>
        <h1 style="letter-spacing: 5px; font-size: 32px;">${newOtp}</h1>
        <p>This OTP expires in <strong>15 minutes</strong>.</p>
        <br/>
        <p>Regards,<br/>Build Gether Support Team</p>
      `,
    });

    return res.json({ message: "A new OTP has been sent to your email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email, password, and role are required" });
    }

    // 2️⃣ Find user by email ONLY
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3️⃣ Role check (extra safety)
    // if (user.role !== role) {
    //   return res.status(403).json({ message: "Role mismatch" });
    // }

    // 4️⃣ Password check
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 5️⃣ Verification check (VERY IMPORTANT)
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Your email is not verified. Please verify your account.",
      });
    }

    // 6️⃣ Generate token
    // const token = generateToken(user._id, user.role);
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: "Login successful",
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let profile;

    switch (user.role) {
      case "collaborator":
        profile = await Collaborator.findOne({ user: user._id })
          .populate("skills")
          .populate("projects");
        break;

      case "project_owner":
        profile = await ProjectOwner.findOne({ user: user._id });
        break;
    }
    res.status(200).json({ user, profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { ...data } = req.body;
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    Object.keys(data).forEach((key) => {
      user[key] = data[key];
    });
    await user.save();
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  getProfile,
  updateProfile,
};
