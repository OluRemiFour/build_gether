const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id || req.userId;
    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "fullName avatar")
      .populate("project", "projectTitle")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
