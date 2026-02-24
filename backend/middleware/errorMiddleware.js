/**
 * Global error handling middleware for the Express application
 */
const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log error for internal monitoring (development)
    if (process.env.NODE_ENV !== 'production') {
        console.error(`[ERROR] ${req.method} ${req.url}:`, err);
    }

    // Handle Zod validation errors
    if (err instanceof ZodError || err.name === 'ZodError' || (err.issues && Array.isArray(err.issues))) {
        const errors = {};
        const issues = err.issues || [];
        issues.forEach(issue => {
            const field = issue.path[issue.path.length - 1];
            if (field) {
                errors[field] = issue.message;
            }
        });

        return res.status(400).json({
            success: false,
            message: 'Please check the form for errors',
            errors,
        });
    }

    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };
