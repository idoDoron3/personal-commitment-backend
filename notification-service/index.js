const express = require('express');
const app = express();
require('dotenv').config();
const connectDB = require('./config/db');
const startConsumer = require('./messaging/consumer');

app.get('/', (req, res) => {
  res.send('Service is running...');
});


(async () => {
  await connectDB();
  await startConsumer();
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Service running on port ${PORT}`);
});
