
const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path");

const sequelize = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const viewRoutes = require("./routes/viewRoutes");

dotenv.config();

const app = express();


// ==========================================
// EXPRESS CONFIGURATION
// ==========================================

app.set("view engine", "ejs");

app.set(
    "views",
    path.join(__dirname, "views")
);


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(express.json());

app.use(cookieParser());


// ==========================================
// ROUTES
// ==========================================

app.use("/", viewRoutes);

app.use("/auth", authRoutes);

app.use("/expense", expenseRoutes);

app.use("/purchase", purchaseRoutes);

app.use("/user", userRoutes);

app.use("/report", reportRoutes);


// ==========================================
// START SERVER
// ==========================================

module.exports = app;

if (require.main === module) {
    const startServer = async () => {
        try {
            await sequelize.sync();

            const PORT = process.env.PORT || 3000;

            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        } catch (err) {
            console.error("Server startup error:", err);
            process.exit(1);
        }
    };

    startServer();
}