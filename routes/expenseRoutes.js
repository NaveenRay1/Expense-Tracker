
const express = require("express");

const router = express.Router();

const authenticate = require("../middlewares/authMiddleware");

const {
    addExpense,
    getAllExpense,
    updateExpense,
    deleteExpense,
    getTransactionSummary,
    getReport,
    getDayWiseSummary,
    filterExpenses
} = require("../controllers/expenseController");


// Add transaction
router.post(
    "/add",
    authenticate,
    addExpense
);


// Get transactions
router.get(
    "/all",
    authenticate,
    getAllExpense
);


// Update transaction
router.put(
    "/update/:id",
    authenticate,
    updateExpense
);


// Delete transaction
router.delete(
    "/delete/:id",
    authenticate,
    deleteExpense
);


// Transaction summary
router.get(
    "/summary",
    authenticate,
    getTransactionSummary
);


// Report data
router.get(
    "/report",
    authenticate,
    getReport
);


// Day-wise summary
router.get(
    "/day-wise",
    authenticate,
    getDayWiseSummary
);


// Filter transactions
router.post(
    "/filter",
    authenticate,
    filterExpenses
);


module.exports = router;

