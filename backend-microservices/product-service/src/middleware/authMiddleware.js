const jwt = require('jsonwebtoken');
const User = require('../models/Product'); 
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userId && userRole) {
        req.user = {
            _id: userId,
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
