const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RefreshToken = sequelize.define('RefreshToken', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    expiry: {
        type: DataTypes.DATE,
        allowNull: false,
    },
});

module.exports = RefreshToken;
