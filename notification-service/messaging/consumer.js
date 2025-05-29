const amqp = require('amqplib');
const eventHandlers = require('../config/eventHandlers');

const retryHandler = async (handlerFunc, data, maxRetries = 3, baseDelay = 500) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await handlerFunc(data);
      return true; 
    } catch (err) {
      attempt++;
      console.warn(`⚠️ Attempt ${attempt} failed:`, err.message);
      if (attempt >= maxRetries) {
        throw new Error(`Failed after ${maxRetries} retries`);
      }

      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential growth: 500ms → 1000ms → 2000ms
      console.log(`⏳ Waiting ${delay}ms before retry...`);

      await new Promise(res => setTimeout(res, delay));
    }
  }
};


const startConsumer = async () => {
  const connection = await amqp.connect(process.env.RABBITMQ_URI);
  const channel = await connection.createChannel();

  await channel.assertExchange(process.env.RABBITMQ_EXCHANGE, 'direct', { durable: true });
  await channel.assertQueue(process.env.QUEUE_NOTIFICATIONS, { durable: true });

  for (const routingKey of Object.keys(eventHandlers)) {
    await channel.bindQueue(process.env.QUEUE_NOTIFICATIONS, process.env.RABBITMQ_EXCHANGE, routingKey);
  }

  console.log(`📥 Listening for events: ${Object.keys(eventHandlers).join(', ')}`);

  channel.consume(process.env.QUEUE_NOTIFICATIONS, async (msg) => {
    try {
      const event = JSON.parse(msg.content.toString());
      const { eventType, data } = event;

      const handler = eventHandlers[eventType];

      if (!handler) {
        console.warn(`⚠️ No handler found for event type: ${eventType}`);
        return channel.ack(msg); // Unknown event — discard
      }

      console.log(`➡️ Processing event: ${eventType}`);
      await retryHandler(handler, data);  // 🔥 Wrapped with retry mechanism
      console.log(`✅ Successfully handled: ${eventType}`);

      channel.ack(msg); // Message successfully processed

    } catch (err) {
      console.error(`❌ Final failure processing message:`, err.message);
      channel.nack(msg, false, false); // ❌ Discard after retries
    }
  });
};

module.exports = startConsumer;
