const express = require("express");
const { protect } = require("../middleware/auth");
const { 
  getConversations, 
  getMessages, 
  sendMessage,
  deleteConversation,
  markConversationAsRead,
  markConversationAsUnread
} = require("../controllers/messageController.js");

const router = express.Router();

// Get all conversations for logged-in user
router.get("/conversations", protect, getConversations);

// Get messages for a specific conversation
router.get("/:conversationId", protect, getMessages);

// Send a message
router.post("/send", protect, sendMessage);

// Delete a conversation
router.delete("/:conversationId", protect, deleteConversation);

// Mark as read/unread
router.patch("/:conversationId/read", protect, markConversationAsRead);
router.patch("/:conversationId/unread", protect, markConversationAsUnread);

module.exports = router;
