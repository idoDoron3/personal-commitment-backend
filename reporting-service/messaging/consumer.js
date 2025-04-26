const amqp = require('amqplib');
const eventHandlers = require('../config/eventHandlers');

const startConsumer = async () => {
  const connection = await amqp.connect(process.env.RABBITMQ_URI);
  const channel = await connection.createChannel();

  await channel.assertExchange(process.env.RABBITMQ_EXCHANGE, 'direct', { durable: true });
  await channel.assertQueue(process.env.QUEUE_REPORTS, { durable: true });


  for (const routingKey of Object.keys(eventHandlers)) {
    await channel.bindQueue(process.env.QUEUE_REPORTS, process.env.RABBITMQ_EXCHANGE, routingKey);
  }

  console.log(`📥 Listening for events: ${Object.keys(eventHandlers).join(', ')}`);

  channel.consume(process.env.QUEUE_REPORTS, async (msg) => {
    try {
        const event = JSON.parse(msg.content.toString());
        const { eventType, data } = event;

        const handler = eventHandlers[eventType];

        if (!handler) { 
            console.warn(`⚠️ No handler found for event type: ${eventType}`);
            return channel.ack(msg);  // Acknowledge to discard unknown events
        }

        console.log(`➡️ Processing event: ${eventType}`);
        await handler(data);
        console.log(`✅ Successfully handled: ${eventType}`);

        channel.ack(msg);

        } catch (err) {
        console.error(`❌ Error processing message:`, err);
        channel.nack(msg, false, false);  // Discard problematic message
        }
    });
};

module.exports = startConsumer;