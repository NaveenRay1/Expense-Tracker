
const User = require("../models/User");
const Expense = require("../models/Expense");


// ==========================================
// LOGIN PAGE
// ==========================================

const renderLoginPage = (req, res) => {
    return res.render("login");
};


// ==========================================
// FORGOT PASSWORD PAGE
// ==========================================

const renderForgotPasswordPage = (req, res) => {
    return res.render("forgot");
};


// ==========================================
// RESET PASSWORD PAGE
// ==========================================

const renderResetPasswordPage = (req, res) => {
    return res.render("reset", {
        token: req.query.token
    });
};


// ==========================================
// DAY-WISE PAGE
// ==========================================

const renderDayWisePage = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.user.id
            }
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        return res.render("dayWise", {
            user
        });

    } catch (err) {
        console.error(
            "Day-wise page error:",
            err.message
        );

        return res.status(500).send(
            "Something went wrong while loading the page"
        );
    }
};


// ==========================================
// TRANSACTIONS PAGE
// ==========================================

const renderTransactionsPage = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.user.id
            }
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        return res.render("transactions", {
            user,
            transactions: []
        });

    } catch (err) {
        console.error(
            "Transactions page error:",
            err.message
        );

        return res.status(500).send(
            "Something went wrong while loading transactions"
        );
    }
};




// ==========================================
// LEADERBOARD PAGE
// ==========================================

const renderLeaderboardPage = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.user.id
            }
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        return res.render("leaderboard", {
            user
        });

    } catch (err) {
        console.error(
            "Leaderboard page error:",
            err.message
        );

        return res.status(500).send(
            "Something went wrong while loading leaderboard"
        );
    }
};


// ==========================================
// SETTINGS PAGE
// ==========================================

const renderSettingsPage = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                id: req.user.id
            }
        });

        if (!user) {
            return res.status(404).send("User not found");
        }

        return res.render("setting", {
            user,
            totalIncome: user.totalIncome
        });

    } catch (err) {
        console.error(
            "Settings page error:",
            err.message
        );

        return res.status(500).send(
            "Something went wrong while loading settings"
        );
    }
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    renderLoginPage,
    renderForgotPasswordPage,
    renderResetPasswordPage,
    renderDayWisePage,
    renderTransactionsPage,
    renderLeaderboardPage,
    renderSettingsPage
};

