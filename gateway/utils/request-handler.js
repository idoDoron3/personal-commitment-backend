const axios = require("axios");

// Service URLs and configuration
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL,
  // Future services can be added here
  // lesson: process.env.LESSON_SERVICE_URL || 'http://localhost:3002',
};

// Set of public routes that do not require authentication
const publicRoutes = new Set([
  "/register",
  "/login",
  "/refresh",
  "/reset-password",
  "/forgot-password",
  "/logout",
]);

// Forwards HTTP requests to the appropriate microservice
exports.forwardRequest = async (req, res, service, endpoint) => {
  try {
    const isPublicRoute = publicRoutes.has(endpoint);

    // Prepare request headers
    let headers = {
      "Content-Type": "application/json",
    };
    if (!isPublicRoute) {
      const { authorization } = req.headers;
      // Validate presence of Authorization header for non-public routes
      if (!authorization) {
        return res
          .status(401)
          .json({ error: "Authorization header is missing" });
      }
      const token = authorization.split(" ")[1]; // // Extract the token from "Bearer <token>"

      if (!token) {
        return res.status(401).json({ error: "Token not found" });
      }
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Forward the request to the specified service and endpoint
    const response = await axios({
      method: req.method,
      url: `${process.env[`${service.toUpperCase()}_SERVICE_URL`]}${endpoint}`,
      data: req.body,
      headers: headers,
    });

    // Return the response from the microservice
    res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
