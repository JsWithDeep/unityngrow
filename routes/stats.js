const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");

router.get("/admin/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    // 🔹 Sum of coins from all users
    const coinsAgg = await User.aggregate([
      { $group: { _id: null, totalCoins: { $sum: "$coins" } } }
    ]);
    const totalCoins = coinsAgg[0]?.totalCoins || 0;

    const pendingRequests = await Transaction.countDocuments({ status: "pending" });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalEarnings: totalCoins, // now shows sum of coins from all users
        pendingRequests
      }
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
