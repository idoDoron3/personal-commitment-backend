const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const lessonRoutes = require("./routes/lessonRoute");
const { sequelize } = require('./models');
const { errorHandler } = require("./utils/errors/errorHandler");
const { initRabbitMQ } = require('./messaging/producer');

require("dotenv").config(); // Load env variables from .env

const app = express();
const PORT = process.env.SERVER_PORT || 3002; // Match pattern from auth-service

// Database connection and sync
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync models (in production, you might want to remove this)
    await sequelize.sync({ force: false });
    console.log('Models synchronized with database.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1); // Exit if we can't connect to database
  }
}

initRabbitMQ().catch(err => {
  console.error("❌ Could not connect to RabbitMQ. Exiting...");
  process.exit(1);
});


// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Gateway or frontend address
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Lesson Service API",
      version: "1.0.0",
      description: "API for managing lessons, tutors, and tutees",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`, // dynamic server URL
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get("/", (req, res) => {
  res.send("Lesson Service is running...");
});

// Mount routes
app.use("/lessons", lessonRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server with database connection
async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();

    // Then start the server
    app.listen(PORT, () => {
      console.log(`Lesson Service running on http://localhost:${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
