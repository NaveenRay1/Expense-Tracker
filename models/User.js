const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User',{
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
    },
    userName:{
        type:DataTypes.STRING,
        allowNull:false,

    },
    email:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true,

    },
    password:{
        type:DataTypes.STRING,
        allowNull:false
    },
    isPremium:{
        type:DataTypes.BOOLEAN,
        defaultValue:false
    },
    totalExpense:{
        type:DataTypes.FLOAT,
        defaultValue:0
    },
    totalIncome:{
    type:DataTypes.FLOAT,
    defaultValue:0
}
})

module.exports = User;