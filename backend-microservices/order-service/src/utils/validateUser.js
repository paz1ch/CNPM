const { authService } = require('./axiosInstances.js');
const logger = require('./logger');

const validateToken = async (token) => {
    try {
        const response = await authService.post('/auth/validate-token', { token }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Return user when present, otherwise null to indicate invalid/absent user
        return response && response.data && response.data.user ? response.data.user : null;
    } catch (error) {
        logger.error('Token validation failed: %o', error.response ? error.response.data : error.message);
        // Return null so callers get a consistent falsy value on failure
        return null;
    }
};

module.exports = { validateToken };
