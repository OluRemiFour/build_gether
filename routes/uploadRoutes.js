const express = require("express");
const upload = require("../middleware/upload");
const router = express.Router();
const { protect } = require("../middleware/auth");

router.post("/", protect, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Construct URL (assuming server serves 'uploads' static folder)
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    
    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: imageUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
