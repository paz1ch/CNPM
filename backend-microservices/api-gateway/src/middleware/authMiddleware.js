const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const validateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('Access attempt without valid token!');
        return res.status(401).json({
            message: 'Authentication required',
            success: false
        })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Invalid token!');
            return res.status(403).json({
                message: 'Invalid token',
                success: false,
            });
        }

        req.user = user;
        next();
    });
}

const attachUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = user;
            }
            next();
        });
    } else {
        next();
    }
};

module.exports = {validateToken, attachUser};