const logger = require('../utils/logger');
const Order = require('../models/order');
const validateToken = require('../utils/validateUser');

const createOrder = async (req, res) => {
    const token = req.cookies.token;
    const user = await verifyToken(token);
    
    console.log('User from token:', user);
};