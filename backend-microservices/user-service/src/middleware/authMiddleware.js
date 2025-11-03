const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            logger.error('Not authorized, token failed', error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        logger.warn('Not authorized, no token');
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

const checkRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        logger.warn(`User with role '${req.user ? req.user.role : 'guest'}' tried to access a protected route`);
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
};

module.exports = { protect, checkRole };
