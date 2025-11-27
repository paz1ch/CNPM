const Restaurant = require('../models/Restaurant');
const logger = require('../utils/logger');

// Create a new restaurant
exports.createRestaurant = async (req, res) => {
    try {
        const { name, address, location, imageUrl } = req.body;

        if (!name || !address || !location || !location.lat || !location.lng) {
            return res.status(400).json({
                success: false,
                message: 'Name, address, and location (lat, lng) are required'
            });
        }

        const restaurant = new Restaurant({
            name,
            address,
            location,
            imageUrl,
            ownerId: req.user ? req.user.userId : null
        });

        await restaurant.save();

        logger.info('New restaurant created', { restaurantId: restaurant._id, name: restaurant.name });

        res.status(201).json({
            success: true,
            message: 'Restaurant created successfully',
            restaurant
        });
    } catch (error) {
        logger.error('Error creating restaurant', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to create restaurant',
            error: error.message
        });
    }
};

// Get all restaurants
exports.getAllRestaurants = async (req, res) => {
    try {
        const { ownerId } = req.query;
        const filter = {};

        if (ownerId) {
            filter.ownerId = ownerId;
        }

        const restaurants = await Restaurant.find(filter).sort({ createdAt: -1 });
        res.json({
            success: true,
            count: restaurants.length,
            restaurants
        });
    } catch (error) {
        logger.error('Error fetching restaurants', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch restaurants',
            error: error.message
        });
    }
};

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        res.json({
            success: true,
            restaurant
        });
    } catch (error) {
        logger.error('Error fetching restaurant', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch restaurant',
            error: error.message
        });
    }
};
