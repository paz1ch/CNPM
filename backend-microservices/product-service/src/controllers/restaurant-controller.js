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

        // Check if user already has a restaurant
        if (req.user && req.user.userId) {
            console.log('Checking existing restaurant for user:', req.user.userId);
            const existingRestaurant = await Restaurant.findOne({ ownerId: req.user.userId });
            if (existingRestaurant) {
                console.log('Found existing restaurant:', existingRestaurant._id);
                return res.status(400).json({
                    success: false,
                    message: 'You have already created a restaurant profile.'
                });
            }
        } else {
            console.warn('Create restaurant called without user ID in req.user:', req.user);
        }

        const restaurant = new Restaurant({
            name,
            address,
            location,
            imageUrl,
            ownerId: req.user ? req.user.userId : null
        });

        await restaurant.save();

        logger.info('New restaurant created', { restaurantId: restaurant._id, name: restaurant.name, ownerId: restaurant.ownerId });

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
        console.log('Get all restaurants query:', req.query);
        const filter = {};

        if (ownerId) {
            filter.ownerId = ownerId;
        }

        const restaurants = await Restaurant.find(filter).sort({ createdAt: 1 });
        console.log(`Found ${restaurants.length} restaurants for filter:`, filter);
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

// Update restaurant
exports.updateRestaurant = async (req, res) => {
    try {
        const { name, address, location, imageUrl } = req.body;
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Check ownership/role
        if (req.user.role !== 'admin' && restaurant.ownerId && restaurant.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this restaurant'
            });
        }

        if (name) restaurant.name = name;
        if (address) restaurant.address = address;
        if (location) restaurant.location = location;
        if (imageUrl) restaurant.imageUrl = imageUrl;

        await restaurant.save();

        res.json({
            success: true,
            message: 'Restaurant updated successfully',
            restaurant
        });
    } catch (error) {
        logger.error('Error updating restaurant', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update restaurant',
            error: error.message
        });
    }
};

// Delete restaurant
exports.deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Check ownership/role
        if (req.user.role !== 'admin' && restaurant.ownerId && restaurant.ownerId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this restaurant'
            });
        }

        // Check for active orders
        try {
            // Use environment variable or fallback to localhost for local dev
            const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
            const checkUrl = `${orderServiceUrl}/api/orders/internal/restaurant/${req.params.id}/check`;

            logger.info(`Checking orders for restaurant deletion: ${checkUrl}`);

            const response = await fetch(checkUrl);

            if (response.ok) {
                const data = await response.json();
                logger.info('Orders check result:', data);

                if (data.hasAnyOrders) {
                    return res.status(400).json({
                        success: false,
                        message: `Cannot delete restaurant with ${data.totalCount} associated orders (active or historical). Please contact support if you need to archive this restaurant.`
                    });
                }
            } else {
                logger.warn('Failed to check orders', { status: response.status, statusText: response.statusText });
                // If we can't verify, it's safer to block deletion to prevent data inconsistency
                return res.status(500).json({
                    success: false,
                    message: 'Could not verify orders. Please try again later.'
                });
            }
        } catch (err) {
            logger.error('Error communicating with order service', { error: err.message });
            return res.status(500).json({
                success: false,
                message: 'Could not verify active orders (Connection Error). Please try again later.'
            });
        }

        await restaurant.deleteOne();

        logger.info('Restaurant deleted', { restaurantId: req.params.id, deletedBy: req.user.userId });

        res.json({
            success: true,
            message: 'Restaurant deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting restaurant', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to delete restaurant',
            error: error.message
        });
    }
};
