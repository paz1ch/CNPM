
const logger = require('../utils/logger');

const protect = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId) {
        logger.warn('Unauthorized access attempt: No x-user-id header');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = {
        userId: userId,
        role: userRole
    };

    next();
};

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};

module.exports = { protect, checkRole };
