exports.getCoins = (req, res) => {
  if (!req.session.user) {
    console.log("error from the user controller ");
    console.log("User not found in session");
    return res.status(401).json({ success: false, message: "User not found" });
  }

  const coins = req.session.user.coins || 0; // or get from DB if needed

  res.json({ success: true, coins });
};
