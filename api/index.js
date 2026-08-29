const app = require("../server");
const sequelize = require("../config/db");

let dbConnection;

const connectDatabase = async () => {
    if (!dbConnection) {
        dbConnection = sequelize.authenticate();
    }

    await dbConnection;
};

module.exports = async (req, res) => {
    try {
        await connectDatabase();
        return app(req, res);
    } catch (err) {
        console.error("Database connection error:", err);

        return res.status(500).json({
            message: "Database connection failed"
        });
    }
};