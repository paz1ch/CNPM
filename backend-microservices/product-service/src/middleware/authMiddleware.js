const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userId && userRole) {
        req.user = {
            userId: userId, // Changed from _id to userId to match controller expectation
            _id: userId,    // Keep _id for compatibility
            role: userRole,
        };
        next();
    } else {
        logger.warn('Not authorized, no user information in headers');
        res.status(401).json({ success: false, message: 'Not authorized' });
    }
};

const checkRole = (roles) => (req, res, next) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
        logger.warn(`User with role '${req.user.role}' tried to access a protected route`);
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
};

module.exports = { protect, checkRole };
