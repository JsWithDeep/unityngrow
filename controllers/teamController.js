const User = require('../models/User');

exports.getMyTeam = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.phone) {
      console.log("❌ Session missing or no phone:", req.session.user);
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }

    const currentUserPhone = req.session.user.phone;

    console.log("🔍 Finding users referred by phone:", currentUserPhone);

    const teamMembers = await User.find({ referralPhone: currentUserPhone });

    console.log("✅ Team members found:", teamMembers.length);

    res.status(200).json({
      success: true,
      data: teamMembers,
    });
  } catch (err) {
    console.error('❌ Error fetching team:', err.message);
    res.status(500).json({ message: 'Server error while fetching team.' });
  }
};
