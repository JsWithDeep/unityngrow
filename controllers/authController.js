const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { sendOTP } = require("../services/mailService");

// 🔧 Generate a 6-character alphanumeric user ID
const generateUserId = () => uuidv4().split("-")[0].slice(0, 6).toUpperCase();

// 🔐 Generate a 6-digit numeric OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 📅 Format date as DD-MMM-YYYY
const formatDate = () => {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ✅ REGISTER USER
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, referralInput } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // ✅ Check if email/phone already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(409).json({ message: "Email or phone already registered." });
    }

    // ✅ Determine referral details
    let referralPhone = null;
    let referredBy = null;

    if (referralInput) {
      let refUser = null;

      // Check if input is likely a phone number (only digits, length 10)
      const phoneRegex = /^[0-9]{10,11}$/;

      if (phoneRegex.test(referralInput)) {
        // Input is a phone number → find by phone
        refUser = await User.findOne({ phone: referralInput });
      } else {
        // Otherwise assume it's a userId → find by userId
        refUser = await User.findOne({ userId: referralInput.toUpperCase() });
      }

      if (!refUser) {
        return res.status(404).json({ message: "Referrer not found." });
      }

      referralPhone = refUser.phone;
      referredBy = refUser.userId;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      referralPhone,
      referredBy,
      userId: generateUserId(),
      otp: generateOTP(),
      otpExpiresAt: Date.now() + 10 * 60 * 1000,
      isVerified: false,
      registrationDate: formatDate(),
      coins: 0,
    });

    await newUser.save();
    await sendOTP(email, newUser.otp);

    res.status(201).json({
      message: "User registered successfully. OTP sent to email.",
      userId: newUser.userId,
    });

  } catch (err) {
    console.error("❌ Registration Error:", err.message);
    res.status(500).json({ message: "Server error during registration." });
  }
};


// ✅ VERIFY OTP
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.otp !== otp) {
      return res.status(409).json({ message: "Invalid OTP." });
    }

    if (Date.now() > user.otpExpiresAt) {
      return res.status(410).json({ message: "OTP expired. Please request a new one." });
    }

    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (err) {
    console.error("❌ OTP Verification Error:", err.message);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
};
// ✅ LOGIN USER
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password are required." });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    // ✅ Admin check
    const isAdmin = phone === "8427697894"; 
    
    const userSessionData = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      coins: user.coins,
      phone: user.phone,
      isAdmin,
    };

    // ✅ Store user session
    req.session.user = userSessionData;

    // ✅ Save session before sending response
    req.session.save(err => {
      if (err) {
        console.error("❌ Session Save Error:", err);
        return res.status(500).json({ message: "Error saving session" });
      }

      // Optional: Persistent cookie
      res.cookie("userInfo", JSON.stringify(userSessionData), {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        sameSite: "strict",
        // secure: true, // enable only on HTTPS
      });

      res.status(200).json({
        message: "Login successful",
        userId: user.userId,
        name: user.name,
        coins: user.coins,
        isAdmin,
      });

      console.log("✅ User logged in:", req.session.user);
    });

  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ message: "Server error during login." });
  }
};

// 📧 Request Password Reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: "No account found with this phone number." });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await sendOTP(user.email, otp);

    res.status(200).json({
      message: `OTP sent to ${user.email}`,
      email: user.email,
    });
  } catch (err) {
    console.error("❌ Password Reset Request Error:", err.message);
    res.status(500).json({ message: "Server error during password reset request." });
  }
};

// 🔐 Verify Reset OTP
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.otp !== otp) {
      return res.status(409).json({ message: "Invalid OTP." });
    }

    if (Date.now() > user.otpExpiresAt) {
      return res.status(410).json({ message: "OTP expired." });
    }

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (err) {
    console.error("❌ Verify Reset OTP Error:", err.message);
    res.status(500).json({ message: "Server error during OTP verification." });
  }
};

// 🔁 Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("❌ Reset Password Error:", err.message);
    res.status(500).json({ message: "Server error during password update." });
  }
};
