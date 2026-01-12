const Task = require("../models/Task");
const Project = require("../models/CreateProject");
const Notification = require("../models/Notification");

const createTask = async (req, res) => {
  try {
    const { projectId, title, description, assignee, deadline, priority } = req.body;
    const ownerId = req.userId;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (project.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: "Only project owner can create tasks" });
    }

    const newTask = new Task({
      project: projectId,
      title,
      description,
      assignee,
      deadline,
      priority,
    });

    await newTask.save();

    // Create notification for assignee
    if (assignee) {
      await Notification.create({
        recipient: assignee,
        sender: ownerId,
        type: "task_assigned",
        project: projectId,
        text: `You have been assigned a new task: ${title}`,
      });
    }

    res.status(201).json({ success: true, message: "Task created successfully", task: newTask });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, note } = req.body;
    const userId = req.userId;

    const task = await Task.findById(taskId).populate("project");
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Allow project owner or assignee to update status
    const isOwner = task.project.owner.toString() === userId.toString();
    const isAssignee = task.assignee?.toString() === userId.toString();

    if (!isOwner && !isAssignee) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    if (status) task.status = status;
    if (note) {
      task.notes.push({
        user: userId,
        text: note,
      });
    }

    await task.save();

    // Create notification for assignee (if updated by owner) or owner (if updated by assignee)
    const recipient = userId.toString() === task.project.owner.toString() ? task.assignee : task.project.owner;
    if (recipient) {
      await Notification.create({
        recipient,
        sender: userId,
        type: "task_updated",
        project: task.project._id,
        text: `Task "${task.title}" has been updated to ${status}`,
      });
    }

    res.status(200).json({ success: true, message: "Task updated successfully", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId }).populate("assignee", "fullName avatar");
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;

    const task = await Task.findById(taskId).populate("project");
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.project.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only project owner can delete tasks" });
    }

    await Task.findByIdAndDelete(taskId);
    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  updateTaskStatus,
  getProjectTasks,
  deleteTask,
};
