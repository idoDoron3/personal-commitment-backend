const express = require('express');
const app = express();
// require('dotenv').config();
if (!process.env.RUNNING_IN_DOCKER) {
  require("dotenv").config();
}
const connectDB = require('./config/db');
const startConsumer = require('./messaging/consumer');

app.get('/', (req, res) => {
  res.send('Service is running...');
});


(async () => {
  await connectDB();
  await startConsumer();
})();

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Service running on port ${PORT}`);
});
