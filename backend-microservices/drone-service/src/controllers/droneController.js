const Drone = require('../models/Drone');
const logger = require('../utils/logger');

exports.getDrones = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const drones = await Drone.find(filter).sort({ createdAt: -1 });

        logger.info('Retrieved drones list', { count: drones.length, filter });

        res.json({
            success: true,
            count: drones.length,
            drones
        });
    } catch (error) {
        logger.error('Error fetching drones', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch drones',
            error: error.message
        });
    }
};

exports.addDrone = async (req, res) => {
    try {
        const { name, battery, location } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Drone name is required'
            });
        }

        const drone = new Drone({
            name,
            battery: battery || 100,
            location: location || { lat: 10.762622, lng: 106.660172 },
            status: 'IDLE'
        });

        await drone.save();

        logger.info('New drone added', { droneId: drone._id, name: drone.name });

        res.status(201).json({
            success: true,
            message: 'Drone created successfully',
            drone
        });
    } catch (error) {
        logger.error('Error adding drone', { error: error.message });
        res.status(400).json({
            success: false,
            message: 'Failed to create drone',
            error: error.message
        });
    }
};

exports.getDeliveryStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        const drone = await Drone.findOne({ currentOrderId: orderId });

        if (!drone) {
            logger.warn('No drone found for order', { orderId });
            return res.status(404).json({
                success: false,
                message: 'No drone assigned to this order yet. Please wait...'
            });
        }

        logger.info('Delivery status retrieved', { orderId, droneId: drone._id });

        res.json({
            success: true,
            delivery: {
                orderId,
                droneId: drone._id,
                droneName: drone.name,
                status: drone.status,
                location: drone.location,
                restaurantLocation: drone.restaurantLocation,
                customerLocation: drone.customerLocation,
                battery: drone.battery,
                estimatedTime: calculateETA(drone.status, drone.battery)
            }
        });
    } catch (error) {
        logger.error('Error fetching delivery status', { error: error.message, orderId: req.params.orderId });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery status',
            error: error.message
        });
    }
};

// Helper function to calculate estimated time of arrival
function calculateETA(status, battery) {
    if (status === 'DELIVERED') return 0;
    if (status === 'IDLE') return null;

    // Rough estimate: 2 minutes per 10% battery consumed
    const estimatedMinutes = Math.ceil((100 - battery) / 5);
    return Math.max(1, 15 - estimatedMinutes); // Max 15 minutes
}
