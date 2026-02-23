/**
 * Global error handling middleware for the Express application
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log error for internal monitoring (development)
    if (process.env.NODE_ENV !== 'production') {
        console.error(`[ERROR] ${req.method} ${req.url}:`, err);
    }

    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };
