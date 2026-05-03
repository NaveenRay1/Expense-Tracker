const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { addExpense ,getAllExpense,updateExpense,deleteExpense} = require('../controllers/expenseController');

router.post('/add',authMiddleware,addExpense);
router.get('/all',authMiddleware,getAllExpense);
router.put('/update/:id',authMiddleware,updateExpense);
router.delete('/delete/:id',authMiddleware,deleteExpense);

module.exports = router;