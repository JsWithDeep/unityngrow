// controllers/adminController.js
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const Package = require("../models/Package");
const Transaction = require('../models/Transaction');

// Fetch pending purchases
const getPendingPurchases = async (req, res) => {
  try {
    const pending = await Purchase.find({ status: "pending" });

    // Join user & package data
    const detailed = await Promise.all(
      pending.map(async (p) => {
        const user = await User.findOne({ userId: p.userId }).select(
          "name userId"
        );
        const pkg = await Package.findOne({ packageId: p.packageId }).select(
          "packageId price"
        );
        return {
          _id: p._id,
          userId: p.userId,
          name: user?.name || "Unknown",
          packageId: p.packageId,
          price: pkg?.price || p.price,
          screenshot: p.screenshot,
          status: p.status,
        };
      })
    );

    res.json({ success: true, purchases: detailed });
  } catch (err) {
    console.error("❌ getPendingPurchases error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const approvePurchase = async (req, res) => {
  try {
    const { id } = req.params; // purchase _id
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    // Mark purchase as paid
    purchase.status = "paid";
    await purchase.save();

    // Find buyer
    let buyer = await User.findOne({ userId: purchase.userId });
    if (!buyer) {
      return res.status(404).json({ success: false, message: "Buyer not found" });
    }

    // Coin distribution amounts
    const coinLevels = [150, 450, 45, 5]; // Buyer, level1, level2, level3

    // Give buyer coins
    buyer.coins = (buyer.coins || 0) + coinLevels[0];
    await buyer.save();

    // Distribute to referrers
    let currentUser = buyer;
    for (let level = 1; level < coinLevels.length; level++) {
      if (!currentUser.referredBy) break; // No more referrer

      let referrer = await User.findOne({ userId: currentUser.referredBy });
      if (!referrer) break;

      referrer.coins = (referrer.coins || 0) + coinLevels[level];
      await referrer.save();

      currentUser = referrer; // Move up the chain
    }

    res.json({ success: true, message: "Purchase approved and coins distributed" });

  } catch (err) {
    console.error("❌ approvePurchase error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all users with purchases & placeholder earnings
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("userId name phone referralPhone"); // minimal fields

    const userData = await Promise.all(
      users.map(async (u) => {
        // Find purchases for this user
        const purchases = await Purchase.find({ userId: u.userId }).select(
          "packageId"
        );

        // Get package titles for purchased packageIds
        const packageTitles = [];
        for (const purchase of purchases) {
          const pkg = await Package.findOne({
            packageId: purchase.packageId,
          }).select("title");
          if (pkg) packageTitles.push(pkg.title);
        }

        return {
          userId: u.userId,
          name: u.name || "N/A",
          referralPhone: u.referralPhone || "-",
          phone: u.phone || "-",
          packages: packageTitles,
          totalEarnings: 0, // placeholder
        };
      })
    );

    res.json({ success: true, users: userData });
  } catch (err) {
    console.error("❌ getAllUsers error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get full user details
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId }).lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("❌ getUserById error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update user details
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, referralPhone } = req.body;

    const updated = await User.findOneAndUpdate(
      { userId },
      { name, phone, referralPhone },
      { new: true }
    );

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("❌ updateUser error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Fetch all pending withdrawals
const getPendingWithdrawals = async (req, res) => {
  try {
    const pending = await Transaction.find({ status: "pending" });

    const detailed = await Promise.all(
      pending.map(async (tx) => {
        const user = await User.findOne({ userId: tx.userId }).select("name userId");
        return {
          _id: tx._id,
          userId: tx.userId,
          name: user?.name || "Unknown",
          amount: tx.amount,
          method: tx.method,
          account: tx.account,
          requestedAt: tx.requestedAt,
        };
      })
    );

    res.json({ success: true, withdrawals: detailed });
  } catch (err) {
    console.error("❌ getPendingWithdrawals error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Approve withdrawal
const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    if (!transaction || transaction.status !== "pending") {
      return res.status(404).json({ success: false, message: "Transaction not found or already processed" });
    }

    transaction.status = "completed";
    await transaction.save();

    res.json({ success: true, message: "Withdrawal approved" });
  } catch (err) {
    console.error("❌ approveWithdrawal error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Reject purchase
const rejectPurchase = async (req, res) => {
  try {
    const { id } = req.params; // purchase _id
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    // Mark as rejected
    purchase.status = "rejected";
    await purchase.save();

    // Optional: If you have logic in frontend that shows "Buy Now" based on purchases,
    // simply rejecting will allow it to appear again.
    // If you store package status somewhere else, update that here.

    res.json({ success: true, message: "Purchase rejected successfully" });

  } catch (err) {
    console.error("❌ rejectPurchase error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = {
  getPendingPurchases,
  approvePurchase,
  getAllUsers,
  updateUser,
  getUserById,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectPurchase,
};
