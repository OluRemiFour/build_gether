const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const { protect } = require("../middleware/auth.js");

router.post("/create", protect, taskController.createTask);
router.put("/:taskId/status", protect, taskController.updateTaskStatus);
router.get("/project/:projectId", protect, taskController.getProjectTasks);
router.delete("/:taskId", protect, taskController.deleteTask);

module.exports = router;
