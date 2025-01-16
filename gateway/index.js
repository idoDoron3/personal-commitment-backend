const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const authRoutes = require("./routes/authRoute");
const app = express();
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Gateway",
      version: "1.0.0",
      description:
        "API Gateway for forwarding requests to auth service and other future services",
    },
  },
  apis: ["./routes/*.js"], // Path to your route files (will scan for Swagger annotations)
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes); // Route for auth service

// Example route
app.get("/", (req, res) => {
  res.send("API Gateway is running...");
});

// Start the gateway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(
    `Swagger documentation available at: http://localhost:${PORT}/api-docs`
  );
});
