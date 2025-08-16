const User = require('../models/User');

// Get current user profile
exports.getProfile = async (req, res) => {
  if (!req.session.user || !req.session.user.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await User.findOne({ userId: req.session.user.userId }).select('-password -otp -otpExpiresAt');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  if (!req.session.user || !req.session.user.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const updates = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { userId: req.session.user.userId },
      updates,
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpiresAt');

    res.json({ success: true, data: updatedUser });
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ message: "Server error during update." });
  }
};
