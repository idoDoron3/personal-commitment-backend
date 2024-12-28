const express = require('express');
const sequelize = require('./config/db');
const User = require('./models/User');
const app = express();
const PORT = process.env.SERVER_PORT;

require('dotenv').config(); // reload data from env file

app.use(express.json());

(async () => {
    try {
        await sequelize.sync(); 
        console.log('Database synced successfully!');

        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
})();
