const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { 
  getConversations, 
  getMessages, 
  sendMessage 
} = require("../controllers/messageController.js");

const router = express.Router();

// Get all conversations for logged-in user
router.get("/conversations", protect, getConversations);

// Get messages for a specific conversation
router.get("/:conversationId", protect, getMessages);

// Send a message
router.post("/send", protect, sendMessage);

module.exports = router;
