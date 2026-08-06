const express = require('express');
const router = express.Router();

const authenticate = require('../middlewares/authMiddleware');

const {buyPremium} = require('../controllers/purchaseController');

router.post('/buy',authenticate,buyPremium);

module.exports = router;