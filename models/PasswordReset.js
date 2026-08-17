const {DataTypes} = require('sequelize');

const sequelize = require('../config/db');
const User = require('../models/User');

const PasswordReset = sequelize.define('PasswordReset',{
    id:{
        type:DataTypes.INTEGER,
        primaryKey:true,
        increament:true
    },
    token:{
        type:DataTypes.STRING,
        unique:true,
        allowNull:false
    }
    ,
    expiresAt:{
        type:DataTypes.DATE,
        allowNull:false
    },
    isUsed:{
        type:DataTypes.BOOLEAN,
        defaultValue:false
    }
});

User.hasMany(PasswordReset,{foreignKey:'userId'});
PasswordReset.belongsTo(User,{foreignKey:'userId'});

module.exports = PasswordReset;