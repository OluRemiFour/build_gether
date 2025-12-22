const User = require("../models/User.js");
const Teacher = require("../models/Teacher");
const crypto = require("crypto");
const { transporter } = require("../middleware/sendEmail.js");
const Student = require("../models/Student.js");

function generateTeacherPassword(name, email) {
  const first = name.split(" ")[0].toLowerCase();
  const partEmail = email.split("@")[0].toLowerCase();

  // Add random 4-digit code for security
  const randomCode = Math.floor(1000 + Math.random() * 9000);

  return `${first}${partEmail}${randomCode}`;
}

function generateStudentPassword(name, email) {
  const first = name.split(" ")[0].toLowerCase();
  const partEmail = email.split("@")[0].toLowerCase();
  const randomCode = Math.floor(1000 + Math.random() * 9000);

  return `${first}${partEmail}${randomCode}`;
}

const addTeacher = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Ensure only school/college can add teacher
    if (req.userRole !== "college") {
      return res
        .status(403)
        .json({ message: "Only college admins can add teachers" });
    }

    // Ensure the school admin is authenticated
    const schoolId = req.userId; // decoded from JWT

    // Validate input
    if (!name || !email)
      return res.status(400).json({ message: "Name and email are required" });

    // Check if teacher email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Generate automatic secure password
    const autoPassword = generateTeacherPassword(name, email);

    // Create teacher account
    const teacher = new Teacher({
      name,
      email,
      password: autoPassword, // password hashing occurs in model pre-save
      role: "teacher",
      product_type: "teacher",
      college: schoolId,
      isVerified: true, // teachers added by the school do NOT need OTP
    });

    await teacher.save();

    // SEND EMAIL TO TEACHER
    await transporter.sendMail({
      from: `"Exam Elite" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "You Have Been Added as a Teacher",
      html: `
        <h2>Hello ${name},</h2>

        <p>You have been added as a <strong>Teacher</strong> on the Exam Elite Platform by your school.</p>

        <p>Your temporary login credentials are as follows:</p>

        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${autoPassword}</p>

        <p>Please log in immediately and change your password for security purposes.</p>

        <br/>
        <p>Regards,<br/><strong>Exam Elite Support Team</strong></p>
      `,
    });

    res.status(201).json({
      message: "Teacher added successfully. Login credentials sent via email.",
      teacher: teacher.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// College Admin or Teacher: Add Student
const addStudent = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Only college or teacher can add students
    if (!["college", "teacher"].includes(req.userRole)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const collegeId = req.userRole === "college" ? req.userId : req.collegeId;
    const requesterId = req.userId;

    if (!name || !email)
      return res.status(400).json({ message: "Name and email are required" });

    // Check if student email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Auto-generate student's password
    const autoPassword = generateStudentPassword(name, email);

    // Create student
    const student = new Student({
      name,
      email,
      password: autoPassword,
      role: "student",
      product_type: "student",
      college: collegeId,
      teacher: req.userRole === "teacher" ? requesterId : null,
      isVerified: true,
    });

    await student.save();

    // Add student to college
    await User.findByIdAndUpdate(collegeId, {
      $push: { students: student._id },
    });

    // If teacher adds student → add to teacher's list
    if (req.userRole === "teacher") {
      await Teacher.findByIdAndUpdate(requesterId, {
        $push: { students: student._id },
      });
    }

    // SEND EMAIL TO STUDENT
    await transporter.sendMail({
      from: `"Exam Elite" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Student Account Has Been Created",
      html: `
        <h2>Hello ${name},</h2>

        <p>You have been added as a <strong>Student</strong> on the Exam Elite Platform.</p>

        <p>Your temporary login credentials are as follows:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${autoPassword}</p>

        <p>Please log in and change your password immediately for security.</p>

        <br/>
        <p>Regards,<br/><strong>Exam Elite Support Team</strong></p>
      `,
    });

    return res.status(201).json({
      message: "Student added successfully. Login credentials sent via email.",
      student: student.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all students (College: all students, Teacher: their students)
const getStudents = async (req, res) => {
  try {
    let students;

    if (req.userRole === "college") {
      // Get all students in college
      students = await User.find({
        college: req.collegeId,
        role: "student",
      }).populate("teacher", "name email");
    } else if (req.userRole === "teacher") {
      // Get students added by this teacher
      const teacher = await User.findById(req.userId).populate("students");
      students = teacher.students;
    } else {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all teachers (College Admin only)
const getTeachers = async (req, res) => {
  try {
    if (req.userRole !== "college") {
      return res
        .status(403)
        .json({ message: "Only college admins can view teachers" });
    }

    const teachers = await User.find({
      college: req.collegeId,
      role: "teacher",
    });
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user (self-update or by college admin)
const updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email, phone } = req.body;

    // Verify authorization
    if (req.userId !== userId && req.userRole !== "college") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, phone },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user (College admin only)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (req.userRole !== "college") {
      return res
        .status(403)
        .json({ message: "Only college admins can delete users" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove = require college
    await College.findByIdAndUpdate(req.collegeId, {
      $pull: { teachers: userId, students: userId },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addTeacher,
  addStudent,
  getStudents,
  getTeachers,
  updateUser,
  deleteUser,
};
