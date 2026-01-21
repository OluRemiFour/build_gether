const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Get all conversations for the current user
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "fullName avatar email role") 
      .populate("project", "projectTitle") 
      .sort({ updatedAt: -1 });

    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      // Find the "other" participant
      const otherParticipant = conv.participants.find(p => p._id.toString() !== userId);
      
      // Count unread messages (where userId is NOT in readBy)
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      });

      return {
        id: conv._id,
        participant: {
          id: otherParticipant?._id,
          name: otherParticipant?.fullName || "Unknown User",
          avatar: otherParticipant?.avatar || "",
          role: otherParticipant?.role || "Collaborator"
        },
        lastMessage: conv.lastMessage,
        timestamp: conv.lastMessageAt,
        unread: unreadCount,
        project: conv.project?.projectTitle
      };
    }));

    res.status(200).json({ success: true, conversations: formattedConversations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages for a specific conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Mark messages as read by adding userId to readBy array if not already present
    await Message.updateMany(
        { conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
    );

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      text: msg.text,
      sender: msg.sender.toString() === userId ? 'me' : 'them',
      timestamp: msg.createdAt,
      isRead: msg.readBy.includes(userId)
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
        project: projectId || null, 
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

    // Create notification for recipient
    await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: "message",
        project: projectId || conversation.project || null,
        text: `New message from ${req.user.fullName || "someone"}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
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

// Delete a conversation
const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found or not authorized" });
    }

    // Delete messages first
    await Message.deleteMany({ conversationId });
    
    // Delete conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark conversation as read
const markConversationAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        await Message.updateMany(
            { conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        res.status(200).json({ success: true, message: "Conversation marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Mark conversation as unread (toggle) or similar
const markConversationAsUnread = async (req, res) => {
    try {
        // Placeholder
        res.status(200).json({ success: true, message: "Marked as unread" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  deleteConversation,
  markConversationAsRead,
  markConversationAsUnread
};
