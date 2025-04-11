const mysql = require('mysql2/promise');
const config = require('../config/config.js');

async function createDatabaseIfNotExists() {
    // Get the environment configuration
    const env = process.env.NODE_ENV || 'development';
    const dbConfig = config[env];

    try {
        // Create a connection without specifying a database
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.username,
            password: dbConfig.password
        });

        console.log('Checking if database exists...');

        // Try to create the database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log(`Database ${dbConfig.database} is ready.`);

        // Close the connection
        await connection.end();
    } catch (error) {
        console.error('Failed to create database:', error);
        throw error;
    }
}

const { sequelize } = require('../models');

async function initializeDatabase() {
    try {
        console.log('Starting database initialization...');

        // First, ensure database exists
        await createDatabaseIfNotExists();

        // Test the connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Sync all models
        await sequelize.sync({ force: false }); // Set force: true to drop and recreate tables
        console.log('Database models synchronized successfully.');

        console.log('Database initialization completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

initializeDatabase(); 