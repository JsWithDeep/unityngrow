const express = require("express");
const router = express.Router();
const User = require("../models/User"); // ✅ Ensure this is imported
const db = require("../config/db"); // ✅ Ensure this is imported
const { isAuthenticated } = require("../middleware/authMiddleware.js");

router.get("/coins", isAuthenticated, async (req, res) => {
  const userId = req.session?.user?.userId;
  console.log("➡️ Extracted userId:", userId);

  if (!userId) {
    return res.status(401).json({ success: false, message: "User not found" });
  }

  try {
    const user = await User.findOne({ userId: userId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, coins: user.coins });
  } catch (error) {
    console.error("🛑 DB ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
