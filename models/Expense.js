const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Expense = sequelize.define('Expense',{
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    amount:{
        type:DataTypes.FLOAT,
        allowNull:false
    },
    description:{
        type:DataTypes.STRING,

    },
    category:{
        type:DataTypes.STRING,
        // (e.g., Food, Fuel, Rent).
    },
    type: {
    type: DataTypes.ENUM('expense', 'income'),
    allowNull: false
},
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    }


});

// define associations here
User.hasMany(Expense,{foreignKey:'userId'})
Expense.belongsTo(User,{foreignKey:'userId'});
module.exports = Expense;