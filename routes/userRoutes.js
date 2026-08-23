const express = require('express');

const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const {isPremium} = require('../middlewares/premiumMiddleware');

const {getLeaderboard} = require('../controllers/userController');

router.get(
  "/leaderboard",
  authMiddleware,
  isPremium,
  getLeaderboard
);

module.exports = router;
