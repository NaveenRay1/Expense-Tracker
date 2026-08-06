const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Order = sequelize.define('Order',{
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement:true
    },
    orderId:{
        type:DataTypes.STRING,
        allowNull:true
    },
    status:{
        type:DataTypes.STRING,
        defaultValue:'PENDING'
    },
    paymentId:{
        type:DataTypes.STRING,
        allowNull:true
    }

});

User.hasMany(Order,{foreignKey:'userId'});
Order.belongsTo(User,{foreignKey:'userId'});

module.exports = Order;


