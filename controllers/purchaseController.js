// controllers/purchaseController.js
const Purchase = require("../models/Purchase");
const Package = require("../models/Package");
const path = require("path");
const multer = require("multer");

// ===== Multer setup for screenshot uploads =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads")); // store in public/uploads
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // keep original extension
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ===== Create Purchase with Screenshot =====
const createPurchase = async (req, res) => {
  try {
    const userId = req.session.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Not logged in" });

    const { packageId } = req.body;
    if (!packageId) return res.status(400).json({ success: false, message: "packageId required" });

    const pkg = await Package.findOne({ packageId });
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

    // Prevent duplicate pending/paid purchase
    const existing = await Purchase.findOne({ userId, packageId, status: { $in: ["pending", "paid"] } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Already purchased or pending approval" });
    }

    // Save file path if uploaded
    const screenshotPath = req.file ? `/uploads/${req.file.filename}` : null;

    const purchase = new Purchase({
      userId,
      packageId,
      price: pkg.price,
      status: "pending",
      screenshot: screenshotPath // store screenshot URL
    });

    await purchase.save();
    res.json({ success: true, message: "Purchase request submitted (pending admin approval)", purchase });
  } catch (err) {
    console.error("❌ createPurchase error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===== Get User Purchases (with status) =====
const getUserPurchases = async (req, res) => {
  try {
    const userId = req.session.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const purchases = await Purchase.find({ userId }).select("packageId status -_id");
    res.json({ success: true, purchases });
  } catch (err) {
    console.error("❌ getUserPurchases error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  upload, // export multer middleware
  createPurchase,
  getUserPurchases
};
