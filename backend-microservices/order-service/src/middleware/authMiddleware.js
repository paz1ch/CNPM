const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { validateToken } = require('../utils/validateUser');

const verifyAuthToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer '))
        return res.status(401).json({ message: 'Authorization header missing or malformed' });

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded token to request
        next();
    } catch (error) {
        logger.error('JWT verification failed: %o', error.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const allowIfUserValid = async (req, res, next) => {
    const token = req.headers['authorization'] ? req.headers['authorization'].split(' ')[1] : null;

    if (!token)
        return res.status(401).json({ message: 'Authorization token missing' });
    const user = await validateToken(token);
    if (!user)
        return res.status(401).json({ message: 'User validation failed' });
    req.user = user; // Attach validated user to request
    next();
};

const checkRole = (roles) => (req, res, next) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
        logger.warn(`User with role '${req.user ? req.user.role : 'unknown'}' tried to access a protected route`);
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};

module.exports = { verifyAuthToken, allowIfUserValid, checkRole };