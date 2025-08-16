const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Link to the user making the request
    amount: { type: Number, required: true }, // Withdrawal amount
    method: {
      type: String,
      enum: ["upi", "bank", "paypal"],
      required: true,
    }, // Withdrawal method
    account: {
      type: String,
      required: true,
    }, // UPI ID or Bank Details
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
