const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const {isPremium} = require('../middlewares/premiumMiddleware');

const {
    getLeaderboard,
    getLeaderboardData,
    updateProfile,
    getPublicProfile
} = require("../controllers/userController");

router.get('/leaderboard', authMiddleware, isPremium, getLeaderboard);
router.post('/leaderboard/data', authMiddleware, isPremium, getLeaderboardData);
router.put(
    "/profile",
    authMiddleware,
    updateProfile
);

// Public profile
router.get(
    "/profile/:id",
    getPublicProfile
);
module.exports = router;