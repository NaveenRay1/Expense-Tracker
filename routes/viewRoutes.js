
const express = require("express");

const router = express.Router();

const authenticate = require("../middlewares/authMiddleware");
const { isPremium } = require("../middlewares/premiumMiddleware");

const {
    renderDashboard,
    addExpenseForm,
    renderEditPage
} = require("../controllers/expenseController");

const {
    renderLoginPage,
    renderForgotPasswordPage,
    renderResetPasswordPage,
    renderDayWisePage,
    renderTransactionsPage,
    renderLeaderboardPage,
    renderSettingsPage
} = require("../controllers/viewController");

const {
    renderReportPage
} = require("../controllers/reportController");


// ==========================================
// PUBLIC PAGES
// ==========================================

router.get(
    "/",
    renderLoginPage
);

router.get(
    "/login",
    renderLoginPage
);

router.get(
    "/forgot-password",
    renderForgotPasswordPage
);

router.get(
    "/reset-password",
    renderResetPasswordPage
);

// ==========================================
// AUTHENTICATED PAGES
// ==========================================

router.get(
    "/dashboard",
    authenticate,
    renderDashboard
);

router.post(
    "/add",
    authenticate,
    addExpenseForm
);

router.get(
    "/transactions",
    authenticate,
    renderTransactionsPage
);

router.get(
    "/settings",
    authenticate,
    renderSettingsPage
);

router.get(
    "/edit/:id",
    authenticate,
    renderEditPage
);

// ==========================================
// PREMIUM PAGES
// ==========================================

router.get(
    "/dayWise",
    authenticate,
    isPremium,
    renderDayWisePage
);

router.get(
    "/reports",
    authenticate,
    isPremium,
    renderReportPage
);

router.get(
    "/leaderboard",
    authenticate,
    isPremium,
    renderLeaderboardPage
);