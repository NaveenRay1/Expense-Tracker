
const sequelize = require("../config/db");
const Expense = require("../models/Expense");
const User = require("../models/User");
const { Op } = require("sequelize");

// ==========================================
// ADD EXPENSE / INCOME - API
// ==========================================

const addExpense = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            amount,
            description,
            category,
            type
        } = req.body;

        if (!amount || !description || !category || !type) {
            await transaction.rollback();

            return res.status(400).json({
                msg: "fill all fields"
            });
        }

        if (!["expense", "income"].includes(type)) {
            await transaction.rollback();

            return res.status(400).json({
                msg: "invalid transaction type"
            });
        }

        const userId = req.user.id;

        const expense = await Expense.create(
            {
                amount,
                description,
                category,
                type,
                userId
            },
            {
                transaction
            }
        );

        if (type === "expense") {
            await User.increment("totalExpense", {
                by: Number(amount),
                where: { id: userId },
                transaction
            });
        } else {
            await User.increment("totalIncome", {
                by: Number(amount),
                where: { id: userId },
                transaction
            });
        }

        await transaction.commit();

        return res.status(201).json({
            msg: "created",
            data: expense
        });

    } catch (err) {
        await transaction.rollback();

        console.error("Add expense error:", err.message);

        return res.status(500).json({
            msg: "Something went wrong while creating the transaction"
        });
    }
};


// ==========================================
// GET ALL EXPENSES / INCOME
// ==========================================

const getAllExpense = async (req, res) => {
    try {
        const userId = req.user.id;

        const page = Math.max(
            parseInt(req.query.page, 10) || 1,
            1
        );

        const limit = Math.max(
            parseInt(req.query.limit, 10) || 10,
            1
        );

        const offset = (page - 1) * limit;

        const where = {
            userId
        };

        const {
            type,
            category,
            date,
            startDate,
            endDate
        } = req.query;

        if (type) {
            where.type = type;
        }

        if (category) {
            where.category = category;
        }

        if (date) {
            const startOfDay = new Date(`${date}T00:00:00`);
            const endOfDay = new Date(`${date}T23:59:59`);

            where.date = {
                [Op.gte]: startOfDay,
                [Op.lte]: endOfDay
            };
        }

        if (startDate || endDate) {
            where.date = {};

            if (startDate) {
                where.date[Op.gte] =
                    new Date(`${startDate}T00:00:00`);
            }

            if (endDate) {
                where.date[Op.lte] =
                    new Date(`${endDate}T23:59:59`);
            }
        }

        const sort =
            req.query.sort === "oldest"
                ? "ASC"
                : "DESC";

        const result = await Expense.findAndCountAll({
            where,
            limit,
            offset,
            order: [["date", sort]]
        });

        const totalItems = result.count;

        return res.status(200).json({
            msg: "Transactions fetched successfully",

            data: result.rows,

            pagination: {
                currentPage: page,
                limit,
                totalItems,
                totalPages: Math.ceil(
                    totalItems / limit
                )
            }
        });

    } catch (err) {
        console.error(
            "Get expenses error:",
            err.message
        );

        return res.status(500).json({
            msg: "Something went wrong while fetching transactions"
        });
    }
};


// ==========================================
// UPDATE EXPENSE / INCOME
// ==========================================

const updateExpense = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const expenseId = req.params.id;
        const userId = req.user.id;

        const {
            amount,
            description,
            category,
            type
        } = req.body;

        if (
            !amount ||
            !description ||
            !category ||
            !type
        ) {
            await transaction.rollback();

            return res.status(400).json({
                msg: "fill all fields"
            });
        }

        if (!["expense", "income"].includes(type)) {
            await transaction.rollback();

            return res.status(400).json({
                msg: "invalid transaction type"
            });
        }

        const expense = await Expense.findOne({
            where: {
                id: expenseId,
                userId
            },
            transaction
        });

        if (!expense) {
            await transaction.rollback();

            return res.status(404).json({
                msg: "expense not found"
            });
        }

        const oldAmount = Number(expense.amount);
        const oldType = expense.type;
        const newAmount = Number(amount);

        await expense.update(
            {
                amount: newAmount,
                description,
                category,
                type
            },
            {
                transaction
            }
        );

        // Expense -> Expense
        if (
            oldType === "expense" &&
            type === "expense"
        ) {
            const difference =
                newAmount - oldAmount;

            await User.increment("totalExpense", {
                by: difference,
                where: { id: userId },
                transaction
            });
        }

        // Expense -> Income
        else if (
            oldType === "expense" &&
            type === "income"
        ) {
            await User.increment("totalExpense", {
                by: -oldAmount,
                where: { id: userId },
                transaction
            });

            await User.increment("totalIncome", {
                by: newAmount,
                where: { id: userId },
                transaction
            });
        }

        // Income -> Expense
        else if (
            oldType === "income" &&
            type === "expense"
        ) {
            await User.increment("totalIncome", {
                by: -oldAmount,
                where: { id: userId },
                transaction
            });

            await User.increment("totalExpense", {
                by: newAmount,
                where: { id: userId },
                transaction
            });
        }

        // Income -> Income
        else {
            const difference =
                newAmount - oldAmount;

            await User.increment("totalIncome", {
                by: difference,
                where: { id: userId },
                transaction
            });
        }

        await transaction.commit();

        return res.status(200).json({
            msg: "updated successfully"
        });

    } catch (err) {
        await transaction.rollback();

        console.error(
            "Update expense error:",
            err.message
        );

        return res.status(500).json({
            msg: "Something went wrong while updating the transaction"
        });
    }
};


// ==========================================
// DELETE EXPENSE / INCOME
// ==========================================

const deleteExpense = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const expenseId = req.params.id;
        const userId = req.user.id;

        const expense = await Expense.findOne({
            where: {
                id: expenseId,
                userId
            },
            transaction
        });

        if (!expense) {
            await transaction.rollback();

            return res.status(404).json({
                msg: "expense not found"
            });
        }

        const amount = Number(expense.amount);

        await expense.destroy({
            transaction
        });

        if (expense.type === "expense") {
            await User.increment("totalExpense", {
                by: -amount,
                where: { id: userId },
                transaction
            });
        } else {
            await User.increment("totalIncome", {
                by: -amount,
                where: { id: userId },
                transaction
            });
        }

        await transaction.commit();

        return res.status(200).json({
            msg: "deleted successfully"
        });

    } catch (err) {
        await transaction.rollback();

        console.error(
            "Delete expense error:",
            err.message
        );

        return res.status(500).json({
            msg: "Something went wrong while deleting the transaction"
        });
    }
};


// ==========================================
// TRANSACTION SUMMARY
// ==========================================

const getTransactionSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        const transactions = await Expense.findAll({
            where: {
                userId
            }
        });

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach((transaction) => {
            const amount = Number(transaction.amount);

            if (transaction.type === "income") {
                totalIncome += amount;
            } else if (transaction.type === "expense") {
                totalExpense += amount;
            }
        });

        return res.status(200).json({
            msg: "fetch successfully",

            data: {
                totalIncome,
                totalExpense,
                balance:
                    totalIncome - totalExpense
            }
        });

    } catch (err) {
        console.error(
            "Transaction summary error:",
            err.message
        );

        return res.status(500).json({
            msg: "Something went wrong while fetching summary"
        });
    }
};


// ==========================================
// DAY-WISE SUMMARY
// ==========================================

const getDayWiseSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                msg: "date is required"
            });
        }

        const startOfDay =
            new Date(`${date}T00:00:00`);

        const endOfDay =
            new Date(`${date}T23:59:59`);

        const dayTransactions =
            await Expense.findAll({
                where: {
                    userId,
                    date: {
                        [Op.gte]: startOfDay,
                        [Op.lte]: endOfDay
                    }
                },

                order: [["date", "DESC"]]
            });

        let totalIncome = 0;
        let totalExpense = 0;

        dayTransactions.forEach((transaction) => {
            const amount =
                Number(transaction.amount);

            if (transaction.type === "income") {
                totalIncome += amount;
            } else if (
                transaction.type === "expense"
            ) {
                totalExpense += amount;
            }
        });

        const transactions =
            dayTransactions.map((transaction) => ({
                title: transaction.description,
                category: transaction.category,
                amount: transaction.amount,
                date: transaction.date,
                type: transaction.type
            }));

        return res.status(200).json({
            msg: "fetched successfully",
            totalIncome,
            totalExpense,
            netAmount:
                totalIncome - totalExpense,
            transLength:
                dayTransactions.length,
            transactions
        });

    } catch (err) {
        console.error(
            "Day-wise summary error:",
            err.message
        );

        return res.status(500).json({
            msg: "Something went wrong while fetching day-wise data"
        });
    }
};


// ==========================================
// REPORT DATA
// ==========================================

const getReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                msg: "startDate and endDate are required"
            });
        }

        const start =
            new Date(`${startDate}T00:00:00`);

        const end =
            new Date(`${endDate}T23:59:59`);

        const transactions =
            await Expense.findAll({
                where: {
                    userId,
                    date: {
                        [Op.gte]: start,
                        [Op.lte]: end
                    }
                },

                order: [["date", "ASC"]]
            });

        let totalIncome = 0;
        let totalExpense = 0;

        const categoryWiseExpense = {};

        transactions.forEach((transaction) => {
            const amount =
                Number(transaction.amount);

            if (transaction.type === "income") {
                totalIncome += amount;
            }

            if (transaction.type === "expense") {
                totalExpense += amount;

                const category =
                    transaction.category;

                if (!categoryWiseExpense[category]) {
                    categoryWiseExpense[category] = 0;
                }

                categoryWiseExpense[category] += amount;
            }
        });

        return res.status(200).json({
            msg: "Report generated successfully",

            data: {
                startDate,
                endDate,
                totalIncome,
                totalExpense,
                balance:
                    totalIncome - totalExpense,
                categoryWiseExpense,
                transactions
            }
        });

    } catch (err) {
        console.error(
            "Report error:",
            err.message
        );

        return res.status(500).json({
            msg: "Something went wrong while generating report"
        });
    }
};


// ==========================================
// RENDER DASHBOARD
// ==========================================

const renderDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findOne({
            where: {
                id: userId
            }
        });

        if (!user) {
            return res.redirect("/login");
        }

        const allTransactions =
            await Expense.findAll({
                where: {
                    userId
                },

                order: [["date", "DESC"]]
            });

        let totalIncome = 0;
        let totalExpense = 0;

        allTransactions.forEach((transaction) => {
            const amount =
                Number(transaction.amount);

            if (transaction.type === "income") {
                totalIncome += amount;
            } else if (
                transaction.type === "expense"
            ) {
                totalExpense += amount;
            }
        });

        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];

        const now = new Date();

        const monthTotals = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );

            const month = date.getMonth();
            const year = date.getFullYear();

            const total =
                allTransactions
                    .filter((transaction) => {
                        const transactionDate =
                            new Date(transaction.date);

                        return (
                            transaction.type === "expense" &&
                            transactionDate.getMonth() === month &&
                            transactionDate.getFullYear() === year
                        );
                    })
                    .reduce(
                        (sum, transaction) =>
                            sum +
                            Number(transaction.amount),
                        0
                    );

            monthTotals.push({
                month: monthNames[month],
                total
            });
        }

        const maxTotal =
            Math.max(
                ...monthTotals.map(
                    (month) => month.total
                ),
                1
            );

        const completeHeights =
            monthTotals.map((month) => ({
                month: month.month,
                height: Math.round(
                    (month.total / maxTotal) * 100
                )
            }));

        const transactions =
            allTransactions
                .slice(0, 5)
                .map((transaction) => ({
                    title: transaction.description,
                    date:
                        new Date(
                            transaction.date
                        ).toLocaleDateString(),
                    amount: transaction.amount,
                    type: transaction.type
                }));

        return res.render("home", {
            user,
            totalIncome,
            totalExpense,
            completeHeights,
            transactions
        });

    } catch (err) {
        console.error(
            "Dashboard error:",
            err.message
        );

        return res.status(500).send(
            "Something went wrong loading the dashboard"
        );
    }
};


// ==========================================
// ADD EXPENSE / INCOME - DASHBOARD FORM
// ==========================================

const addExpenseForm = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const {
            amount,
            title,
            category,
            type
        } = req.body;

        if (!amount || !title || !category || !type) {
            await transaction.rollback();

            return res.status(400).send(
                "Please fill all required fields"
            );
        }

        if (!["expense", "income"].includes(type)) {
            await transaction.rollback();

            return res.status(400).send(
                "Invalid transaction type"
            );
        }

        const userId = req.user.id;

        await Expense.create(
            {
                amount,
                description: title,
                category,
                type,
                userId
            },
            {
                transaction
            }
        );

        if (type === "expense") {
            await User.increment("totalExpense", {
                by: Number(amount),
                where: { id: userId },
                transaction
            });
        } else {
            await User.increment("totalIncome", {
                by: Number(amount),
                where: { id: userId },
                transaction
            });
        }

        await transaction.commit();

        return res.redirect("/");

    } catch (err) {
        await transaction.rollback();

        console.error(
            "Add transaction form error:",
            err.message
        );

        return res.status(500).send(
            "Something went wrong creating the transaction"
        );
    }
};


// ==========================================
// FILTER EXPENSES
// ==========================================

const filterExpenses = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            filters = {},
            page = [1, 10]
        } = req.body;

        const pageNumber =
            Number(page[0]) || 1;

        const limit =
            Number(page[1]) || 10;

        const offset =
            (pageNumber - 1) * limit;

        const where = {
            userId
        };

        if (
            filters.transactionType &&
            filters.transactionType !== "all"
        ) {
            where.type =
                filters.transactionType;
        }

        if (
            filters.category &&
            filters.category !== "all"
        ) {
            where.category =
                filters.category;
        }

        if (
            filters.amountRange &&
            filters.amountRange !== "any"
        ) {
            const [min, max] =
                filters.amountRange
                    .split("_")
                    .map(Number);

            where.amount = {
                [Op.gte]: min,
                [Op.lte]: max
            };
        }

        if (
            filters.dateRange &&
            filters.dateRange !== "all"
        ) {
            const now = new Date();

            let start;

            if (filters.dateRange === "today") {
                start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate()
                );
            }

            if (
                filters.dateRange === "this_week"
            ) {
                start = new Date(now);

                start.setDate(
                    now.getDate() - now.getDay()
                );

                start.setHours(
                    0,
                    0,
                    0,
                    0
                );
            }

            if (
                filters.dateRange === "this_month"
            ) {
                start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                );
            }

            if (
                filters.dateRange === "this_year"
            ) {
                start = new Date(
                    now.getFullYear(),
                    0,
                    1
                );
            }

            if (start) {
                where.date = {
                    [Op.gte]: start
                };
            }
        }

        const result =
            await Expense.findAndCountAll({
                where,
                limit,
                offset,
                order: [["date", "DESC"]]
            });

        const data =
            result.rows.map((transaction) => ({
                id: transaction.id,

                // Frontend display name.
                // Database field remains "description".
                title:
                    transaction.description,

                // Existing frontend expects this.
                desc:
                    transaction.category,

                category:
                    transaction.category,

                date:
                    new Date(
                        transaction.date
                    ).toLocaleDateString(),

                amount:
                    transaction.amount,

                type:
                    transaction.type
            }));

        return res.status(200).json({
            data,
            count: result.count
        });

    } catch (err) {
        console.error(
            "Filter expenses error:",
            err.message
        );

        return res.status(500).json({
            msg: "Something went wrong while filtering transactions"
        });
    }
};


// ==========================================
// RENDER EDIT PAGE
// ==========================================

const renderEditPage = async (req, res) => {
    try {
        const expenseId = req.params.id;
        const userId = req.user.id;

        const expense = await Expense.findOne({
            where: {
                id: expenseId,
                userId
            }
        });

        if (!expense) {
            return res.status(404).send(
                "Transaction not found"
            );
        }

        return res.render("edit", {
            transaction: expense
        });

    } catch (err) {
        console.error(
            "Edit page error:",
            err.message
        );

        return res.status(500).send(
            "Something went wrong"
        );
    }
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    addExpense,
    getAllExpense,
    updateExpense,
    deleteExpense,
    getTransactionSummary,
    getDayWiseSummary,
    getReport,
    renderDashboard,
    addExpenseForm,
    filterExpenses,
    renderEditPage
};

