const jwt = require("jsonwebtoken");
const appError = require("../utils/errors/appError");

/**
 * Extracts and verifies the user ID from a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object} - The extracted user information
 * @throws {appError} - If token verification fails or user ID is not found
 */
const extractUserInfoFromToken = (token) => {
    try {
        // Verify JWT secret is configured
        if (!process.env.JWT_SECRET) {
            throw new appError("JWT secret not configured", 500, "ConfigurationError", "Token Verification");
        }

        const decodedInfo = jwt.decode(token);

        // Extract user information from token
        const userInfo = {
            userId: decodedInfo.sub || decodedInfo.userId || decodedInfo.id,
            fullName: decodedInfo.fullName || decodedInfo.name,
            role: decodedInfo.role
        };

        if (!userInfo.userId) {
            throw new appError("Token does not contain user ID", 403, "AuthenticationError", "Token Structure");
        }

        return userInfo;
    } catch (error) {
        // Re-throw appError instances, wrap others
        if (error instanceof appError) {
            throw error;
        }
        throw new appError("Invalid or expired token", 403, "AuthenticationError", "Token Verification");
    }
};

/**
 * Middleware to authenticate requests using JWT tokens
 * Extracts and verifies the user ID from the Authorization header
 * Attaches the user information to the request object
 */
exports.extractUserInfo = (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new appError("Invalid auth header format", 401, "AuthenticationError", "Auth Header");
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new appError("No token provided", 401, "AuthenticationError", "Token Extraction");
        }

        // Extract and verify user information
        const userInfo = extractUserInfoFromToken(token);

        // Attach user information to the request object
        req.userId = userInfo.userId;
        req.userFullName = userInfo.fullName;
        req.userRole = userInfo.role;
        // req.userEmail = userInfo.email;

        next();
    } catch (error) {
        // Pass appError instances directly, wrap others
        if (error instanceof appError) {
            next(error);
        } else {
            next(new appError("Invalid or expired token", 403, "AuthenticationError", "Token Processing"));
        }
    }
}; 