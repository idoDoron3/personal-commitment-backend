require('dotenv').config(); // reload data from env file
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,       // db name
    process.env.DB_USER,       // user name
    process.env.DB_PASSWORD,   // password
    {
        host: process.env.DB_HOST,  
        port: process.env.DB_PORT,  
        dialect: 'mysql',        
    }
);

module.exports = sequelize;

