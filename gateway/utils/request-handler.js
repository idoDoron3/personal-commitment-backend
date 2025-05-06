const axios = require("axios");
const jwt = require("jsonwebtoken");
const { aggregateHomeData } = require("../aggregators/home-aggregator");

// Service URLs and configuration
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL,
  // Future services can be added here
  lesson: process.env.LESSON_SERVICE_URL
};

// Set of public routes that do not require authentication
const publicRoutes = new Set([
  "/register",
  "/login",
  "/refresh",
  "/verify-reset-code",
  "/update-password",
  "/forgot-password",
  "/logout",
]);

const adminOnlyRoutes = new Set([
  "/admin/add-subject",
  "/admin/remove-subject",
  "/admin/add-user",
  "/admin/delete-user",
  // REPORTS ROUTES
  "/reports/average-lessons-per-mentor",
  "/reports/lessons-created-last-week",
  "/reports/mentor-overview",
  "/reports/average-mentor",
  "/reports/completed-mentor-lessons",
  "/reports/top-mentors-completed-lessons",
  "/reports/lesson-grade-distribution"

]);

// const routesRequiringCookies = new Set(["/login", "/refresh"]);

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

      // 🛡️ בדיקה האם מדובר בנתיב אדמין
      // if (adminOnlyRoutes.has(endpoint)) {
      if ([...adminOnlyRoutes].some(route => endpoint.startsWith(route))) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded.role !== "admin") {
            return res
              .status(403)
              .json({ error: "Access denied. Admins only." });
          }
        } catch (err) {
          return res.status(403).json({ error: "Invalid or expired token" });
        }
      }
      headers["Authorization"] = `Bearer ${token}`;
    }

    //Forward the request to the specified service and endpoint
    const response = await axios({
      method: req.method,
      url: `${process.env[`${service.toUpperCase()}_SERVICE_URL`]}${endpoint}`,
      data: req.body,
      headers: headers,
      withCredentials: true, //  adding cookies, if not working delete this
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

// Home Aggregation Endpoint
exports.getHomeData = async (req, res) => {
  try {
    const result = await aggregateHomeData(req);
    res.status(200).json(result);
  } catch (err) {
    console.error("Home data aggregation error:", err);
    res.status(500).json({ error: err.message || "Failed to get home data" });
  }
};
