require('dotenv').config();
const express = require('express');
const connectDB = require('./config/dbConfig');
const startConsumer = require('./messaging/consumer');

const app = express();
app.use(express.json());

app.use('/reports', require('./routes/reportRoute'));

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();
  await startConsumer();

  app.listen(PORT, () => console.log(`🚀 Reports Service running on port ${PORT}`));
};

startServer();
