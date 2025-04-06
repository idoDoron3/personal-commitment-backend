'use strict'; // Recommended for modern JavaScript

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

// Determine the environment ('development', 'production', etc.)
const env = process.env.NODE_ENV || 'development';
// Load the configuration for the current environment
// Ensure this path '../config/config.js' is correct for your project structure
const config = require('../config/config.js')[env];

// Get the base name of the current file (e.g., 'index.js') to exclude it during dynamic loading
const basename = path.basename(__filename);
const models = {}; // Object to hold all loaded models

let sequelize;
// Create the Sequelize instance based on the configuration
if (config.use_env_variable) {
  // Option to use an environment variable for the connection string (e.g., DATABASE_URL on Heroku)
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Standard connection using individual config parameters
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// --- Improvement: Connection Testing ---
sequelize.authenticate()
  .then(() => {
    console.log(`[${env}] Database connection established successfully.`);
  })
  .catch(err => {
    console.error(`[${env}] Unable to connect to the database:`, err);
    // Depending on your application needs, you might want to exit here
    // process.exit(1);
  });

// --- Improvement: Dynamic Model Loading ---
fs
  .readdirSync(__dirname) // Read all files in the current directory (__dirname)
  .filter(file => {
    // Filter criteria:
    return (
      file.indexOf('.') !== 0 && // Exclude hidden files (starting with '.')
      file !== basename && // Exclude this index file itself
      file.slice(-3) === '.js' && // Must end with '.js'
      file.indexOf('.test.js') === -1 // Optional: Exclude test files
    );
  })
  .forEach(file => {
    // Import the model definition function from the file
    // Sequelize model files typically export a function: (sequelize, DataTypes) => { ... return Model; }
    const modelDefinition = require(path.join(__dirname, file));
    // Check if it's a function before calling
    if (typeof modelDefinition === 'function') {
      const model = modelDefinition(sequelize, Sequelize.DataTypes);
      // Store the initialized model in the 'models' object using its name
      // The model name is defined within the model file (e.g., class Tutee extends Model {})
      // Or via sequelize.define('Tutee', ...)
      // This will correctly pick up 'Tutee' if defined in tutee.js
      if (model && model.name) {
        models[model.name] = model;
        console.log(`Loaded model: ${model.name} from ${file}`); // Log loaded models
      } else {
        console.warn(`Model file ${file} did not export a valid Sequelize model with a name.`);
      }
    } else {
      console.warn(`File ${file} does not export a function, skipping model initialization.`);
    }
  });

// --- Association Setup (after all models are loaded) ---
Object.keys(models).forEach(modelName => {
  // Check if the model has an 'associate' method defined
  if (models[modelName].associate) {
    // Call the associate method, passing all loaded models
    console.log(`Associating model: ${modelName}`);
    models[modelName].associate(models);
  }
});

// Attach the sequelize instance and Sequelize constructor to the exported object
// This makes them available throughout your application
models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models; // Export the central 'models' object
