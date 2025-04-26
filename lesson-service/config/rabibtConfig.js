require('dotenv').config();

module.exports = {
  uri: process.env.RABBITMQ_URI,
  exchange: process.env.RABBITMQ_EXCHANGE
};