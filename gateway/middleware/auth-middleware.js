require("dotenv").config();
const jwt = require("jsonwebtoken");

/**
 * Middleware to authenticate access tokens from the Authorization header.
 * Verifies the token and attaches the decoded payload to the request object.
 */
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Check that the Authorization header exists and starts with "Bearer"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Invalid auth header format" });
  }

  // Extract token from the Authorization header
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Verify the token using the shared JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Attach the decoded payload to the request object
    req.user = decoded;
    next();
  } catch (error) {
      if (error.name === "TokenExpiredError") {
      // Token is valid but expired → allow frontend to refresh it
        return res.status(403).json({ error: "Token expired" });
      }
  
    // Other token errors (malformed, invalid, etc.)
    return res.status(401).json({ error: "Invalid token" });
  }
};
