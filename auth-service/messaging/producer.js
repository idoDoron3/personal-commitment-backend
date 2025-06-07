const amqp = require("amqplib");
const rabbitConfig = require("../config/rabibtConfig");

let connection = null;
let channel = null;

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initRabbitMQ = async () => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(
        `[RabbitMQ] Attempt ${retries + 1}/${MAX_RETRIES} to connect to ${
          rabbitConfig.uri
        }`
      );

      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.warn("[RabbitMQ] Error closing old connection:", err.message);
        }
      }

      connection = await amqp.connect(rabbitConfig.uri);
      console.log(`[RabbitMQ] Connection established successfully`);

      connection.on("error", (err) => {
        console.error("[RabbitMQ] Connection error:", err.message);
        channel = null;
      });

      connection.on("close", () => {
        console.warn("[RabbitMQ] Connection closed");
        channel = null;
      });

      channel = await connection.createChannel();
      console.log(`[RabbitMQ] Channel created successfully`);

      await channel.assertExchange(rabbitConfig.exchange, "direct", {
        durable: true,
      });
      console.log(
        `[RabbitMQ] Exchange [${rabbitConfig.exchange}] asserted successfully`
      );

      console.log(
        `✅ Connected to RabbitMQ Exchange [${rabbitConfig.exchange}]`
      );
      return;
    } catch (err) {
      console.error(
        `[RabbitMQ] Connection attempt ${retries + 1} failed:`,
        err.message
      );
      retries++;
      if (retries < MAX_RETRIES) {
        console.log(`[RabbitMQ] Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      } else {
        console.error(`[RabbitMQ] Max retries reached. Exiting.`);
        throw err;
      }
    }
  }
};

const publishEvent = async (routingKey, message) => {
  try {
    console.log(
      `[RabbitMQ] Attempting to publish event with routing key: ${routingKey}`
    );

    if (!channel) {
      console.warn("[RabbitMQ] No active channel, trying to reinitialize...");
      await initRabbitMQ();
    }

    if (!channel) {
      throw new Error("RabbitMQ channel still not initialized after retry");
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));

    const success = channel.publish(
      rabbitConfig.exchange,
      routingKey,
      messageBuffer,
      { persistent: true } // Ensure message survives broker restarts
    );

    if (!success) {
      throw new Error("Message was not published successfully");
    }

    console.log(`📤 Published [${routingKey}] event successfully:`, message);
  } catch (error) {
    console.error(`[RabbitMQ] Failed to publish [${routingKey}] event:`, error);
    throw error;
  }
};

// Cleanup on shutdown (good practice)
const cleanup = async () => {
  try {
    if (channel) {
      await channel.close();
      console.log("[RabbitMQ] Channel closed");
    }

    if (connection) {
      await connection.close();
      console.log("[RabbitMQ] Connection closed");
    }

    // Exit the process successfully after cleanup
    process.exit(0);
  } catch (err) {
    console.error("[RabbitMQ] Error during cleanup:", err.message);

    // Exit the process with an error code in case cleanup fails
    process.exit(1);
  }
};

// Attach cleanup logic to termination signals
process.on("SIGINT", cleanup); // e.g. Ctrl+C in terminal
process.on("SIGTERM", cleanup); // e.g. kill command or container stop

module.exports = {
  initRabbitMQ,
  publishEvent,
};
