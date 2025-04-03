const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const lessonRoutes = require("./routes/lessonRoute");

require("dotenv").config(); // Load env variables from .env

const app = express();
const PORT = process.env.SERVER_PORT || 3002; // Match pattern from auth-service

// !DB connection setup
// const connectDB = require("./config/db");
// connectDB();

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

// Start server
app.listen(PORT, () => {
  console.log(`Lesson Service running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});
