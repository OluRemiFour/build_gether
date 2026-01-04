const express = require("express");
const { protect, authorize } = require("../middleware/auth.js");
const { getUser } = require("../controllers/userController.js");

const router = express.Router();

router.post("/me", protect, getUser);
// router.post(
//   "/add-student",
//   protect,
//   authorize("college", "teacher"),
//   addStudent
// );
// router.get("/students", protect, getStudents);
// router.get("/teachers", protect, authorize("college"), getTeachers);
// router.put("/:userId", protect, updateUser);
// router.delete("/:userId", protect, authorize("college"), deleteUser);

module.exports = router;
