const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { addExpense ,getAllExpense,updateExpense,deleteExpense,getTransactionSummary,getReport,getDayWiseSummary,filterExpenses} = require('../controllers/expenseController');

router.post('/add',authMiddleware,addExpense);
router.get('/all',authMiddleware,getAllExpense);
router.put('/update/:id',authMiddleware,updateExpense);
router.delete('/delete/:id',authMiddleware,deleteExpense);
router.get('/summary',authMiddleware,getTransactionSummary);
router.get("/report",authMiddleware,getReport);
router.get('/day-wise', authMiddleware, getDayWiseSummary);
router.post('/filter', authMiddleware, filterExpenses);
module.exports = router;