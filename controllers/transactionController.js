const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, account } = req.body;
    const userId = req.session.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const withdrawAmount = parseInt(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal amount.",
      });
    }

    if (!method || !account) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal method and account are required.",
      });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const MINIMUM_COINS = 50;

    if (user.coins - withdrawAmount < MINIMUM_COINS) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. You must keep at least ${MINIMUM_COINS} coins in your account.`,
      });
    }

    // Deduct coins
    user.coins -= withdrawAmount;
    await user.save();

    // Update session coins
    req.session.user.coins = user.coins;

    // Save the transaction
    const transaction = new Transaction({
      userId,
      amount: withdrawAmount,
      method,
      account,
      status: "pending",
      createdAt: new Date(),
    });

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully.",
      coins: user.coins, // Send updated coins to frontend
    });

  } catch (err) {
    console.error("Withdrawal Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.session.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, transactions });
  } catch (err) {
    console.error("Fetch Transactions Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
