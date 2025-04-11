// middleware/validate-body.js

/**
 * Creates a middleware function that validates request body against a Joi schema
 * @param {Object} schema - Joi schema to validate against
 * @returns {Function} Express middleware function
 */

function validateBody(schema) {
    return (req, res, next) => {
        const options = {
            abortEarly: false,    // Return all errors instead of stopping at first error
            allowUnknown: true,   // Allow unknown keys that will be removed
            stripUnknown: true    // Remove unknown keys for security
        };

        const { error, value } = schema.validate(req.body, options);

        if (error) {
            const errors = error.details.reduce((acc, err) => {
                const field = err.path.join('.');
                const message = err.message.replace(/['"]/g, '');

                if (!acc[field]) {
                    acc[field] = [];
                }
                acc[field].push(message);

                return acc;
            }, {});

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: {
                    fields: errors,
                    count: error.details.length
                }
            });
        }

        req.validatedBody = value; // Safe, clean data
        next();
    };
}

module.exports = validateBody;
