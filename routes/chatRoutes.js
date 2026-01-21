const express = require("express");
const { protect } = require("../middleware/auth");
const { chat, getHistory } = require("../controllers/chatController");

const router = express.Router();

router.post("/send", protect, chat);
router.get("/history", protect, getHistory);

module.exports = router;
