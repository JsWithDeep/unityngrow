// routes/packageRoutes.js
const express = require("express");
const router = express.Router();
const { getPackages, seedPackages } = require("../controllers/packageController");
const { createPurchase, getUserPurchases, upload } = require("../controllers/purchaseController");

// Get all packages
router.get("/packages", getPackages);

// Seed packages (dev only)
router.get("/seed", seedPackages);

// Create purchase (with screenshot upload)
router.post("/purchase", upload.single("screenshot"), createPurchase);

// Get user's purchases
router.get("/user-purchases", getUserPurchases);

module.exports = router;
