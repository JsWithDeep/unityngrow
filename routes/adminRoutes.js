// routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const {
  getPendingPurchases,
  approvePurchase,
  getAllUsers,
  updateUser,
  getUserById,
  rejectPurchase,
} = require("../controllers/adminController");

router.get("/approvals", getPendingPurchases);
router.put("/approvals/:id/approve", approvePurchase);
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.put("/users/:userId", updateUser);

router.put('/approvals/:id/reject',rejectPurchase);

// for transactions 
const {
  getPendingWithdrawals,
  approveWithdrawal,
} = require("../controllers/adminController");

router.get("/withdrawals", getPendingWithdrawals);
router.put("/withdrawals/:id/approve", approveWithdrawal);

module.exports = router;
