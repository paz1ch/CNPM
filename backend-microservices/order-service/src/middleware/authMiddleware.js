const { validateToken } = require('../utils/validateUser');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
    try {
        const token = req.cookies && req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized, no token' });
        }

        const user = await validateToken(token);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized, invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.error('Error in auth middleware: %o', error);
        return res.status(500).json({ message: 'Something went wrong' });
    }
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
