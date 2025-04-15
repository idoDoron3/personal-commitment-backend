/**
 * Global error handling middleware
 */
exports.errorHandler = (err, req, res, next) => {
    const message = err.message || 'Something went wrong';
    const origin = err.origin || 'Unknown';
    const type = err.type || 'INTERNAL_SERVER_ERROR';
    const status = err.statusCode || 500;

    console.error('Handled Error:', err);

    res.status(status).json({
        success: false,
        message,
        statusCode: status,
        type,
        origin,
    });
}; 