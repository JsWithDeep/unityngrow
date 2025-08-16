// models/Package.js
const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  packageId: { type: String, required: true, unique: true }, // e.g. "basic-001"
  title: { type: String, required: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" }, // filename stored in /public/images or /uploads
  price: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Package", packageSchema);
