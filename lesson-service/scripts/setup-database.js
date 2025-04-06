const { sequelize } = require('../models');

async function initializeDatabase() {
    try {
        console.log('Starting database initialization...');

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