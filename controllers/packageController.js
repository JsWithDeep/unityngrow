// controllers/packageController.js
const Package = require("../models/Package");

// GET /api/buy-package/packages
const getPackages = async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: 1 });
    res.json({ success: true, packages });
  } catch (err) {
    console.error("❌ getPackages error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/buy-package/seed  (dev-only helper)
const seedPackages = async (req, res) => {
  try {
    const seed = [
      {
        packageId: "basic-001",
        title: "Basic Growth Package",
        description: "Access core resources and local communities.",
        image: "basic.png", // place this file in public/images
        price: 1000
      },
      {
        packageId: "pro-001",
        title: "Nation Growth Package",
        description: "serving the nation by serving the retired soilders",
        image: "pro.png",
        price: 1000
      },
      {
        packageId: "elite-001",
        title: "Community Growth Package",
        description: "serving the growth to the ngo and our social community",
        image: "elite.png",
        price: 1000
      }
    ];

    // Replace packages (dev)
    await Package.deleteMany({});
    await Package.insertMany(seed);
    res.json({ success: true, message: "Seeded packages", seededCount: seed.length });
  } catch (err) {
    console.error("❌ seedPackages error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getPackages,
  seedPackages
};
