const axios = require('axios');
//const { base } = require('../models/order');

const authService = axios.create({
    baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:5000',
    withCredentials: true,
    timeout: 5000,
});

const restaurantService = axios.create({
    baseURL: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:5001',
    withCredentials: true,
    timeout: 5000,
});

module.exports = {
    authService,
    restaurantService
};