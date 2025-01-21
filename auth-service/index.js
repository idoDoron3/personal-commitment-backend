const express = require("express");
const sequelize = require("./config/db");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cors = require("cors"); // ייבוא CORS
const app = express();
const PORT = process.env.SERVER_PORT || 3001;
const routs = require("./routes/authRoute");

require("dotenv").config(); // reload data from env file
// CORS Configuration
app.use(
  cors({
    origin: "http://localhost:3001", // כתובת ה-Gateway
    credentials: true, // מאפשר cookies
  })
);
app.use(express.json());

// Swagger definitions
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth API",
      version: "1.0.0",
      description: "API for user authentication",
    },
  },
  apis: ["./routes/*.js"],
};

// create Swagger file
const swaggerSpec = swaggerJsdoc(options);

//api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", routs);
(async () => {
  try {
    await sequelize.sync();
    console.log("Database synced successfully!");
    console.log(
      `Swagger documentation available at: http://localhost:${PORT}/api-docs`
    );

    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
})();
