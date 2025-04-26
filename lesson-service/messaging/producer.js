const amqp = require('amqplib');
const rabbitConfig = require('../config/rabibtConfig');

let channel = null;

const initRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(rabbitConfig.uri);
    channel = await connection.createChannel();

    await channel.assertExchange(rabbitConfig.exchange, 'direct', { durable: true });

    console.log(`✅ Connected to RabbitMQ Exchange [${rabbitConfig.exchange}]`);
  } catch (err) {
    console.error("❌ Failed to initialize RabbitMQ:", err);
    throw err;
  }
};

const publishEvent = async (routingKey, message) => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");

  channel.publish(
    rabbitConfig.exchange,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );

  console.log(`📤 Published [${routingKey}] event:`, message);
};

module.exports = { initRabbitMQ, publishEvent };
