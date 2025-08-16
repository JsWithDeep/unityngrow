const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true }, // auto-generated
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true , index: true },
    email: { type: String, required: true, unique: true,index: true },
    password: { type: String, required: true },
    referralPhone: { type: String, default: null },
    referredBy: { type: String, default: null }, //
    isVerified: { type: Boolean, default: false },
    otp: { type: String }, // OTP for verification
    otpExpiresAt: { type: Date }, // optional: helps with OTP expiry
    registrationDate: { type: Date,default :Date.now }, // like "04-Aug-2025"
    coins: { type: Number, default: 0 }, // user's coins
    isAdmin: { type: Boolean, default: false },

    // for the package section
    packageName: { type: String, default: null },
    packageActive: { type: Boolean, default: false },
  },
  {
    timestamps: true, // includes createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model("User", userSchema);
