
const express = require("express");

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const { isPremium } = require("../middlewares/premiumMiddleware");

const {
    getLeaderboardData,
    updateProfile,
    getPublicProfile
} = require("../controllers/userController");


// ==========================================
// PREMIUM LEADERBOARD
// ==========================================

router.post(
    "/leaderboard/data",
    authMiddleware,
    isPremium,
    getLeaderboardData
);


// ==========================================
// UPDATE OWN PROFILE
// ==========================================

router.put(
    "/profile",
    authMiddleware,
    updateProfile
);


// ==========================================
// PUBLIC PROFILE
// ==========================================

router.get(
    "/profile/:id",
    getPublicProfile
);


module.exports = router;

