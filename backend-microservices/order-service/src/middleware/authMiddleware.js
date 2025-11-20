const logger = require('../utils/logger');

const protect = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const restaurantId = req.headers['x-restaurant-id'];

    if (!userId) {
        logger.warn('Unauthorized access attempt: No x-user-id header');
        return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = {
        userId: userId,
        _id: userId,  // Add _id field to match controller expectations
        role: userRole
    };

    // Add restaurantID for restaurant users
    if (restaurantId) {
        req.user.restaurantID = restaurantId;
    }

    next();
};

const isUser = (req, res, next) => {
    if (req.user && req.user.role === 'user') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden, user role required' });
    }
};

const isRestaurant = (req, res, next) => {
    if (req.user && req.user.role === 'restaurant') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden, restaurant role required' });
    }
};

const isDelivery = (req, res, next) => {
    if (req.user && req.user.role === 'delivery') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden, delivery role required' });
    }
};

module.exports = { protect, isUser, isRestaurant, isDelivery };
