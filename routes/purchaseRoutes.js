const express = require('express');
const router = express.Router();

const authenticate = require('../middlewares/authMiddleware');

const {buyPremium,getPaymentStatus} = require('../controllers/purchaseController');

router.post('/buy',authenticate,buyPremium);
router.get('/success', authenticate, getPaymentStatus);
module.exports = router;