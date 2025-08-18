// controllers/purchaseController.js
const Purchase = require("../models/Purchase");
const Package = require("../models/Package");
const path = require("path");
const multer = require("multer");


// ✅ Cloudinary Setup
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ✅ Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "unityngrow_purchases", // Optional folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"],
    public_id: (req, file) => `purchase_${Date.now()}`, // Optional custom name
  },
});




const upload = multer({ storage });

// ===== Create Purchase with Screenshot =====
// ✅ Create Purchase
const createPurchase = async (req, res) => {
  try {
    const userId = req.session.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Not logged in" });

    const { packageId } = req.body;
    if (!packageId) return res.status(400).json({ success: false, message: "packageId required" });

    const pkg = await Package.findOne({ packageId });
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

    const existing = await Purchase.findOne({ userId, packageId, status: { $in: ["pending", "paid"] } });
    if (existing) {
      return res.status(400).json({ success: false, message: "Already purchased or pending approval" });
    }

    // ✅ Save Cloudinary URL if uploaded
    const screenshotUrl = req.file?.path || null;

    const purchase = new Purchase({
      userId,
      packageId,
      price: pkg.price,
      status: "pending",
      screenshot: screenshotUrl, // Now stores the Cloudinary URL
    });

    await purchase.save();

    res.json({
      success: true,
      message: "Purchase request submitted (pending admin approval)",
      purchase,
    });

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

    const purchases = await Purchase.find({ userId }).select("packageId status screenshot -_id");
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
