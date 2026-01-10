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
        availability: "flexible", // Default to valid string enum
        experienceLevel: "beginner", // Default to valid string enum
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
    if (err.code === 11000) {
        return res.status(400).json({ message: "User already exists or verified." });
    }
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 15 * 60 * 1000;

    // Check PendingUser first (Registration flow)
    const pendingUser = await PendingUser.findOne({ email });
    
    if (pendingUser) {
      pendingUser.otp = newOtp;
      pendingUser.otpExpires = otpExpires;
      await pendingUser.save();

      await transporter.sendMail({
        from: `"Build Gether" <${process.env.SENDER_EMAIL}>`,
        to: email,
        subject: "Your New Verification Code",
        html: `
          <h2>Hello ${pendingUser.fullName},</h2>
          <p>Your new One-Time Password (OTP) for email verification is:</p>
          <h1 style="letter-spacing: 5px; font-size: 32px;">${newOtp}</h1>
          <p>This OTP expires in <strong>15 minutes</strong>.</p>
          <br/>
          <p>Regards,<br/>Build Gether Support Team</p>
        `,
      });
      return res.json({ message: "A new OTP has been sent to your email" });
    }

    // Check existing User (maybe implementation for login otp later?)
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isVerified) {
       // Ideally we shouldn't resend verify OTP to verified user, usually.
       // But if this is used for password reset or login, we might want to allow it.
       // For now, keeping original logic: error if verified.
      return res.status(400).json({ message: "Account already verified" });
    }

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

    switch (user.role) {
      case "collaborator":
        profile = await CollaboratorProfile.findOne({ userId: user._id });
        break;

      case "project_owner":
        profile = await ProjectOwnerProfile.findOne({ userId: user._id });
        break;
    }

    const userWithProfile = user.toObject();
    if (profile) {
      Object.assign(userWithProfile, profile.toObject());
    }

    res.status(200).json({ user: userWithProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { 
    // User fields
    fullName, 
    // Profile fields
    bio, location, company, websiteUrl, linkedinUrl, githubUrl, portfolioUrl,
    skills, availability, experienceLevel, roles
  } = req.body;

  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update User Common Fields
    if(fullName) user.fullName = fullName;
    await user.save();

    let profile;
    
    // Update Specific Profile based on Role
    if (user.role === "project_owner") {
      profile = await ProjectOwnerProfile.findOne({ userId: user._id });
      if (!profile) {
          // Verify if verifyOtp created it, if not create now
           profile = await ProjectOwnerProfile.create({ userId: user._id });
      }

      if (bio !== undefined) profile.bio = bio;
      if (location !== undefined) profile.location = location;
      if (company !== undefined) profile.company = company;
      if (websiteUrl !== undefined) profile.websiteUrl = websiteUrl;
      if (linkedinUrl !== undefined) profile.linkedinUrl = linkedinUrl;
      if (githubUrl !== undefined) profile.githubUrl = githubUrl;
      // Map portfolio to website if needed, or keeping distinct
      
      await profile.save();

    } else if (user.role === "collaborator") {
        profile = await CollaboratorProfile.findOne({ userId: user._id });
        if (!profile) {
             profile = await CollaboratorProfile.create({ userId: user._id });
        }

        if (bio !== undefined) profile.bio = bio;
        if (location !== undefined) profile.location = location;
        if (portfolioUrl !== undefined) profile.portfolioUrl = portfolioUrl;
        if (githubUrl !== undefined) profile.githubUrl = githubUrl;
        if (linkedinUrl !== undefined) profile.linkedinUrl = linkedinUrl;
        
        if (skills !== undefined) profile.skills = skills; 
        if (availability !== undefined) profile.availability = availability;
        if (experienceLevel !== undefined) profile.experienceLevel = experienceLevel;
        if (roles !== undefined) {
           // Ensure it maps to the schema structure if needed, or if it's just array of strings
           profile.roles = roles.map(r => typeof r === 'string' ? { type: r } : r);
        }
        
        await profile.save();
    }

    // Refetch full object to return
    // const fullUser = { ...user.toObject(), ...profile.toObject() };
    res.status(200).json({ 
        message: "Profile updated successfully", 
        user: user,
        profile: profile 
    });

  } catch (error) {
    console.error("Update Profile Error", error);
    res.status(500).json({ message: error.message });
  }
};

const getProfileStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let profile;
    const missingFields = [];

    if (!user.fullName) missingFields.push("Full Name");

    if (user.role === "collaborator") {
      profile = await CollaboratorProfile.findOne({ userId: user._id });
      if (!profile) {
        missingFields.push("Bio", "Location", "At least one Skill", "At least one Role", "Availability");
      } else {
        if (!profile.bio) missingFields.push("Bio");
        if (!profile.location) missingFields.push("Location");
        if (!profile.skills || profile.skills.length === 0) missingFields.push("At least one Skill");
        if (!profile.roles || profile.roles.length === 0) missingFields.push("At least one Role");
        if (!profile.availability) missingFields.push("Availability");
      }
    } else if (user.role === "project_owner") {
      profile = await ProjectOwnerProfile.findOne({ userId: user._id });
      if (!profile) {
        missingFields.push("Bio", "Location", "Company Name");
      } else {
        if (!profile.bio) missingFields.push("Bio");
        if (!profile.location) missingFields.push("Location");
        if (!profile.company) missingFields.push("Company Name");
      }
    }

    return res.status(200).json({
      isComplete: missingFields.length === 0,
      missingFields,
      userType: user.role
    });
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
  getProfileStatus,
};
