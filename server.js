const express = require('express');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const path = require('path')
const User = require('./models/User')
const Order = require('./models/Order');
const Expense = require('./models/Expense');
const PasswordReset = require('./models/PasswordReset');
const sequelize = require('./config/db')
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const userRoutes = require("./routes/userRoutes");
const authMiddleware = require('./middlewares/authMiddleware');
const { renderDashboard, addExpenseForm } = require('./controllers/expenseController');
const { isPremium } = require('./middlewares/premiumMiddleware');
const app = express();
app.set("view engine","ejs");
app.use(express.urlencoded({ extended: true }));
app.set("views",path.join(__dirname,"views"));
app.use(express.json());
app.use(cookieParser());
app.get("/", authMiddleware, renderDashboard);
app.post("/add", authMiddleware, addExpenseForm);
app.get('/login',(req,res)=>{
    res.render("login");
})
app.get('/dayWise', authMiddleware, isPremium, async (req, res) => {
    const user = await User.findOne({ where: { id: req.user.id } });
    res.render('daywise', { user });
});
app.use("/user", userRoutes);
app.use('/auth',authRoutes);
app.use('/expense',expenseRoutes);
app.use('/purchase',purchaseRoutes);
const startSever = async() =>{
    try{
        await sequelize.sync({alter:true})
        .then(()=>console.log('databse connected'))
        app.listen(process.env.PORT,()=>{
            console.log('server is running at port',process.env.PORT);
        })
    }
    catch(err){
        console.log(err);
    }
}
startSever();