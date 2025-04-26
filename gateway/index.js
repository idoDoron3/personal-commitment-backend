const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const authRoutes = require("./routes/authRoute");
const lessonRoutes = require("./routes/lessonRoute");
const aggregatorRoutes = require("./routes/aggregator-router");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors"); // ייבוא CORS

require("dotenv").config();

// app.use(
//   cors({
//     origin: "http://localhost:3000", // כתובת הלקוח
//     credentials: true, // מאפשר cookies
//   })
// );
app.use(
  cors({
    origin: "*",
  })
);


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
app.use("/home", aggregatorRoutes);

app.use("/lessons", lessonRoutes); // Route for lesson service
// Example route
app.get("/", (req, res) => {
  res.send("API Gateway is running...");
});

// Start the gateway
const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`API Gateway running on port ${PORT}`);
//   // console.log(
//   //   `Swagger documentation available at: http://132.73.210.155:${PORT}/api-docs`
//   // );
//   console.log(
//     `Swagger documentation available at: http://localhost:${PORT}/api-docs`
//   );
// });
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Gateway listening on http://0.0.0.0:${PORT}`);
});
