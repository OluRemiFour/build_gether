require("dotenv").config();
const User = require("../models/User.js");
const jwt = require("jsonwebtoken");
const {
  validateEmail,
  validatePassword,
} = require("../middleware/validation.js");
const { transporter, sendOtpEmail } = require("../middleware/sendEmail.js");
const { CollaboratorProfile } = require("../models/CollaboratorProfile.js");

const generateToken = (userId, role, product_type) => {
  return jwt.sign({ userId, role, product_type }, process.env.JWT_SECRET, {
    expiresIn: "24hrs",
  });
};

const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      role,
      // terms,
    } = req.body;

    // VALIDATIONS
    if (!validateEmail(email))
      return res.status(400).json({ message: "Invalid email format" });

    if (!validatePassword(password))
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    // if (!terms)
    //   return res.status(400).json({ message: "You must accept terms" });

    // CHECK EXISTING EMAIL
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    // OTP GENERATION
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 10 * 60 * 1000;

    try {
      await sendOtpEmail(email, schoolName, otp);
    } catch (emailError) {
      console.error("EMAIL SENDING FAILED with details:", emailError); // Better logging
      return res.status(500).json({
        message: "Failed to send OTP email.",
        error: emailError.message, // Now shows real message
      });
    }

    // IF EMAIL SUCCESS → CREATE USER
    const user = new User({
      fullName,
      email,
      password,
      role,
      otp,
      otpExpires,
      isVerified: false,
    });

    if (role === "project_owner") {
      await CollaboratorProfile.create({
        userId: user._id,
        name: fullName,
        email: email,
        bio: "",
        location: "",
        company: "",
        portfolioUrl: "",
        githubUrl: "",
        linkedinUrl: "",
      });
    } else if (role === "collaborator") {
      await CollaboratorProfile.create({
        userId: user._id,
        name: fullName,
        email: email,
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

    await user.save();

    return res.status(201).json({
      message: "User registered successfully. OTP sent to email.",
    });
  } catch (error) {
    console.log("REGISTER ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ message: "Account already verified" });

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (user.otpExpires < Date.now())
      return res.status(400).json({ message: "OTP has expired" });

    // MARK USER AS VERIFIED
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    return res.json({
      message: "Email verified successfully, You can now Log in.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    const { email, password, role } = req.body;

    let user = null;

    user = await User.findOne({ email, role });

    if (!user)
      return res.status(404).json({ message: "Invalid email or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    if (
      user.role !== "collaborator" ||
      (user.role !== "project_owner" && !user.isVerified)
    ) {
      return res.status(403).json({
        message: "Your email is not verified. Please verify your account.",
      });
    }
    // const token = generateToken(user._id, user.role, user.product_type);
    const token = generateToken(user._id, user.role);

    // 7️⃣ Return success
    return res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
