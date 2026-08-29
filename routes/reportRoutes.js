const express = require('express');

const router = express.Router();

const authenticate = require('../middlewares/authMiddleware');
const { isPremium } = require('../middlewares/premiumMiddleware');

const {
    downloadMonthlyReport,
    downloadYearlyReport
} = require('../controllers/reportController');

router.get(
    '/monthly/download',
    authenticate,
    isPremium,
    downloadMonthlyReport
);

router.get(
    '/yearly/download',
    authenticate,
    isPremium,
    downloadYearlyReport
);

module.exports = router;