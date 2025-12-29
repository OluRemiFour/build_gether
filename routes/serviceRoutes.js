const express = require("express");
const { matchScore } = require("../controllers/serviceController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/match-score/:userId", protect, matchScore);

module.exports = router;
