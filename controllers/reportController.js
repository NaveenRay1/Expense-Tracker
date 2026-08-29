const Expense = require('../models/Expense');
const PDFDocument = require('pdfkit');

/*
|--------------------------------------------------------------------------
| Helper: get user's transactions
|--------------------------------------------------------------------------
*/

const getUserTransactions = async (userId) => {
    const transactions = await Expense.findAll({
        where: {
            userId: userId
        },
        order: [['date', 'DESC']]
    });

    return transactions;
};


/*
|--------------------------------------------------------------------------
| Helper: check transaction type
|--------------------------------------------------------------------------
*/

const isIncome = (transaction) => {
    return String(transaction.type || '').toLowerCase() === 'income';
};


/*
|--------------------------------------------------------------------------
| Helper: safely get amount
|--------------------------------------------------------------------------
*/

const getAmount = (transaction) => {
    return Number(transaction.amount || 0);
};


/*
|--------------------------------------------------------------------------
| Render Reports Page
|--------------------------------------------------------------------------
*/

const renderReportPage = async (req, res) => {

    try {

        const userId = req.user.id;

        const now = new Date();

        // Month comes from query string.
        // Example: /reports?month=8&year=2026

        let selectedMonth = parseInt(req.query.month);

        let selectedYear = parseInt(req.query.year);


        // Default to current month
        if (
            isNaN(selectedMonth) ||
            selectedMonth < 1 ||
            selectedMonth > 12
        ) {
            selectedMonth = now.getMonth() + 1;
        }


        // Default to current year
        if (
            isNaN(selectedYear) ||
            selectedYear < 2000 ||
            selectedYear > 2100
        ) {
            selectedYear = now.getFullYear();
        }


        /*
        |--------------------------------------------------------------------------
        | Get all transactions of current user
        |--------------------------------------------------------------------------
        */

        const transactions = await getUserTransactions(userId);


        /*
        |--------------------------------------------------------------------------
        | MONTHLY TRANSACTIONS
        |--------------------------------------------------------------------------
        */

        const monthlyTransactions = transactions.filter(transaction => {

            if (!transaction.date) {
                return false;
            }

            const transactionDate = new Date(transaction.date);

            return (
                transactionDate.getMonth() + 1 === selectedMonth &&
                transactionDate.getFullYear() === selectedYear
            );

        });


        /*
        |--------------------------------------------------------------------------
        | Monthly Income / Expense / Savings
        |--------------------------------------------------------------------------
        */

        let monthlyIncome = 0;
        let monthlyExpense = 0;


        monthlyTransactions.forEach(transaction => {

            const amount = getAmount(transaction);

            if (isIncome(transaction)) {
                monthlyIncome += amount;
            } else {
                monthlyExpense += amount;
            }

        });


        const monthlySavings = monthlyIncome - monthlyExpense;


        /*
        |--------------------------------------------------------------------------
        | Selected month name
        |--------------------------------------------------------------------------
        */

        const selectedMonthName = new Date(
            selectedYear,
            selectedMonth - 1,
            1
        ).toLocaleString('en-US', {
            month: 'long'
        });


        /*
        |--------------------------------------------------------------------------
        | YEARLY REPORT
        |--------------------------------------------------------------------------
        */

        const monthlyReport = [];


        let yearlyIncome = 0;
        let yearlyExpense = 0;


        for (let month = 1; month <= 12; month++) {

            let income = 0;
            let expense = 0;


            transactions.forEach(transaction => {

                if (!transaction.date) {
                    return;
                }

                const transactionDate = new Date(transaction.date);


                if (
                    transactionDate.getFullYear() === selectedYear &&
                    transactionDate.getMonth() + 1 === month
                ) {

                    const amount = getAmount(transaction);


                    if (isIncome(transaction)) {
                        income += amount;
                    } else {
                        expense += amount;
                    }

                }

            });


            const savings = income - expense;


            yearlyIncome += income;
            yearlyExpense += expense;


            monthlyReport.push({

                month: new Date(
                    selectedYear,
                    month - 1,
                    1
                ).toLocaleString('en-US', {
                    month: 'long'
                }),

                income,
                expense,
                savings

            });

        }


        const yearlySavings = yearlyIncome - yearlyExpense;


        /*
        |--------------------------------------------------------------------------
        | Render EJS
        |--------------------------------------------------------------------------
        */

        res.render('report', {

            user: req.user,

            selectedMonth,
            selectedYear,
            selectedMonthName,

            monthlyTransactions,

            monthlyIncome,
            monthlyExpense,
            monthlySavings,

            yearlyIncome,
            yearlyExpense,
            yearlySavings,

            monthlyReport

        });

    } catch (err) {

        console.error('Render report error:', err);

        res.status(500).send('Something went wrong while generating the report.');

    }

};


/*
|--------------------------------------------------------------------------
| Download Monthly Report
|--------------------------------------------------------------------------
*/

const downloadMonthlyReport = async (req, res) => {

    try {

        const userId = req.user.id;

        let month = parseInt(req.query.month);
        let year = parseInt(req.query.year);


        const now = new Date();


        if (
            isNaN(month) ||
            month < 1 ||
            month > 12
        ) {
            month = now.getMonth() + 1;
        }


        if (
            isNaN(year) ||
            year < 2000 ||
            year > 2100
        ) {
            year = now.getFullYear();
        }


        /*
        |--------------------------------------------------------------------------
        | Get user's transactions
        |--------------------------------------------------------------------------
        */

        const transactions = await getUserTransactions(userId);


        const monthlyTransactions = transactions.filter(transaction => {

            if (!transaction.date) {
                return false;
            }

            const date = new Date(transaction.date);


            return (
                date.getMonth() + 1 === month &&
                date.getFullYear() === year
            );

        });


        /*
        |--------------------------------------------------------------------------
        | Calculate totals
        |--------------------------------------------------------------------------
        */

        let totalIncome = 0;
        let totalExpense = 0;


        monthlyTransactions.forEach(transaction => {

            const amount = getAmount(transaction);


            if (isIncome(transaction)) {
                totalIncome += amount;
            } else {
                totalExpense += amount;
            }

        });


        const savings = totalIncome - totalExpense;


        const monthName = new Date(
            year,
            month - 1,
            1
        ).toLocaleString('en-US', {
            month: 'long'
        });


        /*
        |--------------------------------------------------------------------------
        | Create PDF
        |--------------------------------------------------------------------------
        */

        const doc = new PDFDocument({
            margin: 50
        });


        res.setHeader(
            'Content-Type',
            'application/pdf'
        );


        res.setHeader(
            'Content-Disposition',
            `attachment; filename="monthly-report-${monthName}-${year}.pdf"`
        );


        doc.pipe(res);


        /*
        |--------------------------------------------------------------------------
        | PDF Header
        |--------------------------------------------------------------------------
        */

        doc
            .fontSize(22)
            .font('Helvetica-Bold')
            .text('ExpenseTracker', {
                align: 'center'
            });


        doc
            .moveDown(0.5)
            .fontSize(18)
            .text(`Monthly Financial Report`, {
                align: 'center'
            });


        doc
            .moveDown(0.3)
            .fontSize(13)
            .font('Helvetica')
            .text(`${monthName} ${year}`, {
                align: 'center'
            });


        doc.moveDown(2);


        /*
        |--------------------------------------------------------------------------
        | Summary
        |--------------------------------------------------------------------------
        */

        doc
            .fontSize(13)
            .font('Helvetica-Bold')
            .text('Financial Summary');


        doc.moveDown(0.5);


        doc
            .font('Helvetica')
            .fontSize(12)
            .text(`Total Income: ₹${totalIncome.toFixed(2)}`);


        doc
            .text(`Total Expense: ₹${totalExpense.toFixed(2)}`);


        doc
            .text(`Savings: ₹${savings.toFixed(2)}`);


        doc.moveDown(2);


        /*
        |--------------------------------------------------------------------------
        | Transactions
        |--------------------------------------------------------------------------
        */

        doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Transactions');


        doc.moveDown(0.7);


        if (monthlyTransactions.length === 0) {

            doc
                .font('Helvetica')
                .fontSize(12)
                .text('No transactions found for this month.');

        } else {

            monthlyTransactions.forEach(transaction => {

                const date = transaction.date
                    ? new Date(transaction.date).toLocaleDateString('en-IN')
                    : '-';


                const title = transaction.description || 'Transaction';

                const amount = getAmount(transaction);

                const type = isIncome(transaction)
                    ? 'Income'
                    : 'Expense';


                doc
                    .font('Helvetica-Bold')
                    .fontSize(11)
                    .text(`${date} - ${title}`);


                doc
                    .font('Helvetica')
                    .fontSize(10)
                    .text(
                        `${type}: ₹${amount.toFixed(2)}`
                    );


                doc.moveDown(0.5);

            });

        }


        /*
        |--------------------------------------------------------------------------
        | Footer
        |--------------------------------------------------------------------------
        */

        doc
            .moveDown(2)
            .fontSize(9)
            .fillColor('gray')
            .text(
                'Generated by ExpenseTracker',
                {
                    align: 'center'
                }
            );


        doc.end();


    } catch (err) {

        console.error('Monthly report download error:', err);

        if (!res.headersSent) {
            res.status(500).send(
                'Unable to generate monthly report.'
            );
        }

    }

};


/*
|--------------------------------------------------------------------------
| Download Yearly Report
|--------------------------------------------------------------------------
*/

const downloadYearlyReport = async (req, res) => {

    try {

        const userId = req.user.id;


        let year = parseInt(req.query.year);


        if (
            isNaN(year) ||
            year < 2000 ||
            year > 2100
        ) {
            year = new Date().getFullYear();
        }


        /*
        |--------------------------------------------------------------------------
        | Get transactions
        |--------------------------------------------------------------------------
        */

        const transactions = await getUserTransactions(userId);


        /*
        |--------------------------------------------------------------------------
        | Calculate yearly data
        |--------------------------------------------------------------------------
        */

        const monthlyData = [];


        let yearlyIncome = 0;
        let yearlyExpense = 0;


        for (let month = 1; month <= 12; month++) {

            let income = 0;
            let expense = 0;


            transactions.forEach(transaction => {

                if (!transaction.date) {
                    return;
                }


                const date = new Date(transaction.date);


                if (
                    date.getFullYear() === year &&
                    date.getMonth() + 1 === month
                ) {

                    const amount = getAmount(transaction);


                    if (isIncome(transaction)) {
                        income += amount;
                    } else {
                        expense += amount;
                    }

                }

            });


            const savings = income - expense;


            yearlyIncome += income;
            yearlyExpense += expense;


            monthlyData.push({

                month: new Date(
                    year,
                    month - 1,
                    1
                ).toLocaleString('en-US', {
                    month: 'long'
                }),

                income,
                expense,
                savings

            });

        }


        const yearlySavings = yearlyIncome - yearlyExpense;


        /*
        |--------------------------------------------------------------------------
        | Create PDF
        |--------------------------------------------------------------------------
        */

        const doc = new PDFDocument({
            margin: 50
        });


        res.setHeader(
            'Content-Type',
            'application/pdf'
        );


        res.setHeader(
            'Content-Disposition',
            `attachment; filename="yearly-report-${year}.pdf"`
        );


        doc.pipe(res);


        /*
        |--------------------------------------------------------------------------
        | Header
        |--------------------------------------------------------------------------
        */

        doc
            .fontSize(22)
            .font('Helvetica-Bold')
            .text('ExpenseTracker', {
                align: 'center'
            });


        doc
            .moveDown(0.5)
            .fontSize(18)
            .text('Yearly Financial Report', {
                align: 'center'
            });


        doc
            .moveDown(0.3)
            .fontSize(13)
            .font('Helvetica')
            .text(`${year}`, {
                align: 'center'
            });


        doc.moveDown(2);


        /*
        |--------------------------------------------------------------------------
        | Yearly Summary
        |--------------------------------------------------------------------------
        */

        doc
            .fontSize(13)
            .font('Helvetica-Bold')
            .text('Yearly Summary');


        doc.moveDown(0.5);


        doc
            .font('Helvetica')
            .fontSize(12)
            .text(
                `Total Income: ₹${yearlyIncome.toFixed(2)}`
            );


        doc.text(
            `Total Expense: ₹${yearlyExpense.toFixed(2)}`
        );


        doc.text(
            `Total Savings: ₹${yearlySavings.toFixed(2)}`
        );


        doc.moveDown(2);


        /*
        |--------------------------------------------------------------------------
        | Month-by-month report
        |--------------------------------------------------------------------------
        */

        doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .text('Monthly Breakdown');


        doc.moveDown(1);


        monthlyData.forEach(data => {

            doc
                .font('Helvetica-Bold')
                .fontSize(11)
                .text(data.month);


            doc
                .font('Helvetica')
                .fontSize(10)
                .text(
                    `Income: ₹${data.income.toFixed(2)}`
                );


            doc.text(
                `Expense: ₹${data.expense.toFixed(2)}`
            );


            doc.text(
                `Savings: ₹${data.savings.toFixed(2)}`
            );


            doc.moveDown(0.7);

        });


        /*
        |--------------------------------------------------------------------------
        | Footer
        |--------------------------------------------------------------------------
        */

        doc
            .moveDown(1)
            .fontSize(9)
            .fillColor('gray')
            .text(
                'Generated by ExpenseTracker',
                {
                    align: 'center'
                }
            );


        doc.end();


    } catch (err) {

        console.error('Yearly report download error:', err);


        if (!res.headersSent) {

            res.status(500).send(
                'Unable to generate yearly report.'
            );

        }

    }

};


/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
    renderReportPage,
    downloadMonthlyReport,
    downloadYearlyReport
};