const express = require('express');
const app = express();

// Middleware for JSON parsing
app.use(express.json());

// Example route
app.get('/', (req, res) => {
  res.send('API Gateway is running...');
});

// Start the gateway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});


const gatewayRoutes = require('./src/routes/gatewayRoutes');

// Use routes
app.use('/gateway', gatewayRoutes);
