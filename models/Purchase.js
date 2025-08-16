// models/Purchase.js
const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // matches your existing user.userId
  packageId: { type: String, required: true }, // matches Package.packageId
  screenshot: String,
  price: { type: Number, required: true },
  status: { type: String, enum: ["paid", "pending", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

purchaseSchema.index({ userId: 1, packageId: 1 }, { unique: true }); // prevents duplicates

module.exports = mongoose.model("Purchase", purchaseSchema);
