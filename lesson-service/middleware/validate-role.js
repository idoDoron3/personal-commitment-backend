const appError = require("../utils/errors/appError");

/**
 * Middleware to validate user role
 * @param {string} requiredRole - The role required to access the route
 * @returns {Function} - Express middleware function
 */
const validateRole = (requiredRole) => {
    return (req, res, next) => {
        try {
            // Check if user role is available
            if (!req.userRole) {
                throw new appError("User role not found in request", 403, "AuthorizationError", "Role Validation");
            }

            // Check if user has the required role
            if (req.userRole !== requiredRole) {
                throw new appError(
                    `Access denied. Required role: ${requiredRole}, User role: ${req.userRole}`,
                    403,
                    "AuthorizationError",
                    "Role Validation"
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = validateRole; 