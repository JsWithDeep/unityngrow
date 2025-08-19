const express = require("express");
const router = express.Router();
const User = require("../models/User");
// Import controller functions
const {
  registerUser,
  loginUser,
  verifyOtp,
} = require("../controllers/authController");

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", registerUser);

// @route   POST /api/auth/login
// @desc    Login user with phone & password
// @access  Public
router.post("/login", loginUser);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email confirmation
// @access  Public
router.post("/verify-otp", verifyOtp);
router.get("/user", async (req, res) => {
  try {
    if (req.session && req.session.user) {
      // Fetch latest coins from DB
      const userInDb = await User.findOne({
        phone: req.session.user.phone,
      }).select("name coins isAdmin");

      if (!userInDb) {
        return res.json({ loggedIn: false });
      }

      // Update session coins
      req.session.user.coins = userInDb.coins;

      return res.json({
        loggedIn: true,
        user: {
          name: userInDb.name,
          coins: userInDb.coins,
          isAdmin: userInDb.isAdmin || false,
        },
      });
    }

    if (req.cookies && req.cookies.userInfo) {
      try {
        const userInfo = JSON.parse(req.cookies.userInfo);
        const userInDb = await User.findOne({ phone: userInfo.phone }).select(
          "name coins isAdmin"
        );

        if (!userInDb) {
          res.clearCookie("userInfo");
          return res.json({ loggedIn: false });
        }

        // Update cookie & session with latest coins
        userInfo.coins = userInDb.coins;
        req.session.user = userInfo;
        res.cookie("userInfo", JSON.stringify(userInfo), {
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: "strict",
        });

        return res.json({
          loggedIn: true,
          user: {
            name: userInDb.name,
            coins: userInDb.coins,
            isAdmin: userInDb.isAdmin || false,
          },
        });
      } catch (err) {
        console.error("Failed to parse userInfo cookie:", err);
        res.clearCookie("userInfo");
        return res.json({ loggedIn: false });
      }
    }

    return res.json({ loggedIn: false });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ loggedIn: false });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid", { path: "/", sameSite: "none", secure: true });
    return res.redirect("/login.html");
  });
});

const {
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/authController");

// New routes
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);


module.exports = router;
