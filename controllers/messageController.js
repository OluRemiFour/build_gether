const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");

// Get all conversations for the current user
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "fullName avatar email role") // Populate basic user info
      .populate("project", "projectTitle") // Populate project title if linked
      .sort({ updatedAt: -1 });

    // Format for frontend
    const formattedConversations = conversations.map(conv => {
      // Find the "other" participant
      const otherParticipant = conv.participants.find(p => p._id.toString() !== userId);
      
      // Count unread messages (mock logic for now, or real if we add read status)
      // For MVP, we'll assume 0 unread since we don't have a complex read-receipt system yet
      const unreadCount = 0; 

      return {
        id: conv._id,
        participant: {
          id: otherParticipant?._id, // Added ID
          name: otherParticipant?.fullName || "Unknown User",
          avatar: otherParticipant?.avatar || "",
          role: otherParticipant?.role || "Collaborator" // Default role
        },
        lastMessage: conv.lastMessage,
        timestamp: conv.lastMessageAt,
        unread: unreadCount,
        project: conv.project?.projectTitle
      };
    });

    res.status(200).json({ success: true, conversations: formattedConversations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages for a specific conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 }); // Sort by oldest first

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      text: msg.text,
      sender: msg.sender.toString() === req.user.id ? 'me' : 'them',
      timestamp: msg.createdAt
    }));

    res.status(200).json({ success: true, messages: formattedMessages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a new message (create conversation if needed)
const sendMessage = async (req, res) => {
  try {
    const { recipientId, projectId, text } = req.body;
    const senderId = req.user.id;

    let conversation;

    // Check if conversation already exists between these two users (optionally scoped to project)
    // For now, let's keep it simple: one conversation per pair of users
    // If projectId is provided, we could verify if a conv exists for that project
    
    // Attempt to find existing conversation
    conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    // If not found, create new one
    if (!conversation) {
      if (!recipientId) {
          return res.status(400).json({ message: "Recipient ID required for new conversation" });
      }
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        project: projectId || null, // Optional link to project context
        lastMessage: text,
        lastMessageAt: Date.now()
      });
    } else {
        // Update existing conversation detail
        conversation.lastMessage = text;
        conversation.lastMessageAt = Date.now();
        await conversation.save();
    }

    // Create the message
    const message = await Message.create({
      conversationId: conversation._id,
      sender: senderId,
      text
    });

    res.status(201).json({ 
        success: true, 
        messageId: message._id, 
        conversationId: conversation._id,
        timestamp: message.createdAt 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage
};
