const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

// Route: POST /api/transactions/withdraw
router.post("/", transactionController.requestWithdrawal);
router.get("/", transactionController.getUserTransactions);

module.exports = router;
