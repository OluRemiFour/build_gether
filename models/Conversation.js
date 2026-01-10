const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ],
  lastMessage: {
    type: String,
    default: ""
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  // Optional: Link to a project context
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project" 
  }
}, { timestamps: true });

module.exports = mongoose.model("Conversation", conversationSchema);
