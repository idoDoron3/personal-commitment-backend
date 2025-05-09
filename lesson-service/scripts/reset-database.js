// require('dotenv').config();
if (!process.env.RUNNING_IN_DOCKER) {
    require("dotenv").config();
  }
const { Sequelize } = require('sequelize');

const resetDatabase = async () => {
    // Create a connection without specifying a database
    const sequelize = new Sequelize('', process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: console.log
    });

    try {
        // Drop the database if it exists
        await sequelize.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
        console.log(`Database ${process.env.DB_NAME} dropped successfully`);

        // Create the database
        await sequelize.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log(`Database ${process.env.DB_NAME} created successfully`);

        // Close the connection
        await sequelize.close();
        console.log('Connection closed');
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
};

resetDatabase();