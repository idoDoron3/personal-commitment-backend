const express = require('express');
const authRoutes = require('./routes/authRoute');
require('dotenv').config();
const app = express();

app.use(express.json());
app.use('/auth', authRoutes); // Route for auth service

// Example route
app.get('/', (req, res) => {
  res.send('API Gateway is running...');
});

// Start the gateway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});


