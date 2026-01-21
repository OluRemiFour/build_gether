const mongoose = require("mongoose");

const aiChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  role: {
    type: String,
    enum: ["user", "ai"],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  feature: {
    type: String,
    default: "ai_assistant"
  }
}, { timestamps: true });

module.exports = mongoose.model("AIChat", aiChatSchema);
