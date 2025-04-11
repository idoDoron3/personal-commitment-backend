const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * Resets the database by truncating all tables
 * @param {Object} options - Configuration options
 * @param {boolean} options.dryRun - If true, only show what would be done without actually doing it
 * @param {string[]} options.tables - Specific tables to reset. If not provided, all tables will be reset
 * @param {boolean} options.force - If true, skip production environment check
 * @returns {Promise<void>}
 */
async function resetDatabase(options = {}) {
    const { dryRun = false, tables = [], force = false } = options;

    try {
        // Safety check for production environment
        if (process.env.NODE_ENV === 'production' && !force) {
            throw new Error('Database reset is not allowed in production environment without force flag');
        }

        console.log('Starting database reset...');
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Dry run: ${dryRun ? 'Yes' : 'No'}`);

        if (tables.length > 0) {
            console.log(`Tables to reset: ${tables.join(', ')}`);
        } else {
            console.log('All tables will be reset');
        }

        // Disable foreign key checks
        if (!dryRun) {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { type: QueryTypes.RAW });
            console.log('Foreign key checks disabled');
        }

        // Get all table names
        const allTables = await sequelize.query(
            "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ?",
            {
                replacements: [sequelize.config.database],
                type: QueryTypes.SELECT
            }
        );

        // Filter tables if specific ones are requested
        const tablesToReset = tables.length > 0
            ? allTables.filter(table => tables.includes(table.TABLE_NAME))
            : allTables;

        if (tablesToReset.length === 0) {
            console.log('No tables found to reset');
            return;
        }

        console.log(`Found ${tablesToReset.length} tables to reset`);

        // Truncate all tables
        for (const table of tablesToReset) {
            const tableName = table.TABLE_NAME;
            if (tableName !== 'SequelizeMeta') {  // Skip Sequelize's migration table
                if (dryRun) {
                    console.log(`[DRY RUN] Would truncate table: ${tableName}`);
                } else {
                    try {
                        await sequelize.query(`TRUNCATE TABLE ${tableName}`, { type: QueryTypes.RAW });
                        console.log(`✓ Truncated table: ${tableName}`);
                    } catch (tableError) {
                        console.error(`✗ Error truncating table ${tableName}:`, tableError.message);
                    }
                }
            } else {
                console.log(`Skipping SequelizeMeta table`);
            }
        }

        // Re-enable foreign key checks
        if (!dryRun) {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { type: QueryTypes.RAW });
            console.log('Foreign key checks re-enabled');
        }

        console.log('Database reset completed successfully!');
    } catch (error) {
        console.error('Error resetting database:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        throw error;
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
    tables: args.filter(arg => !arg.startsWith('--'))
};

// Run the reset
resetDatabase(options)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));