const logger = require('../utils/logger');
const { StatusCodes } = require('http-status-codes');

const errorHandler = (err, req, res, next) => {
    logger.error('Error: %o', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // Mongoose cast error (invalid ID)
    if (err.name === 'CastError') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: `Invalid ${err.path}: ${err.value}`
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: 'Invalid token'
        });
    }

    // Handle axios errors from other services
    if (err.isAxiosError) {
        const status = err.response?.status || StatusCodes.BAD_GATEWAY;
        const message = err.response?.data?.message || 'Service communication error';
        return res.status(status).json({ message });
    }

    // Default error
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.statusCode ? err.message : 'Internal Server Error';

    res.status(statusCode).json({ message });
};

module.exports = errorHandler;
