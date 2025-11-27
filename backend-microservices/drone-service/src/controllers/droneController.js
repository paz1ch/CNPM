const Drone = require('../models/Drone');
const Mission = require('../models/Mission');
const logger = require('../utils/logger');

// @desc    Get all drones
// @route   GET /api/v1/drones
// @access  Public
exports.getDrones = async (req, res) => {
    try {
        const { status, model } = req.query;
        const filter = {};

        if (status) {
            filter.status = status;
        }
        if (model) {
            filter.model = { $regex: model, $options: 'i' };
        }

        const drones = await Drone.find(filter).populate('mission').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: drones.length,
            data: drones
        });
    } catch (err) {
        logger.error(`Error fetching drones: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get a single drone by ID
// @route   GET /api/v1/drones/:id
// @access  Public
exports.getDroneById = async (req, res) => {
    try {
        const drone = await Drone.findById(req.params.id).populate('mission');

        if (!drone) {
            logger.warn(`Drone not found with ID: ${req.params.id}`);
            return res.status(404).json({ success: false, message: 'Drone not found' });
        }

        res.json({ success: true, data: drone });
    } catch (err) {
        logger.error(`Error fetching drone ${req.params.id}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Register a new drone
// @route   POST /api/v1/drones
// @access  Admin
exports.addDrone = async (req, res) => {
    try {
        const { name, model, payloadCapacity, maxSpeed, location, battery } = req.body;

        const newDrone = await Drone.create({
            name,
            model,
            payloadCapacity,
            maxSpeed,
            currentLocation: location, // Map frontend 'location' to schema 'currentLocation'
            batteryLevel: battery // Map frontend 'battery' to schema 'batteryLevel'
        });

        logger.info(`New drone registered: ${newDrone.name} (${newDrone._id})`);
        res.status(201).json({
            success: true,
            message: 'Drone registered successfully',
            data: newDrone
        });
    } catch (err) {
        logger.error(`Error registering drone: ${err.message}`);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Drone name already exists.' });
        }
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update a drone's details
// @route   PUT /api/v1/drones/:id
// @access  Admin
exports.updateDrone = async (req, res) => {
    try {
        const droneId = req.params.id;
        const updates = req.body;

        const drone = await Drone.findById(droneId);

        if (!drone) {
            logger.warn(`Update failed. Drone not found with ID: ${droneId}`);
            return res.status(404).json({ success: false, message: 'Drone not found' });
        }

        // Prevent updates if the drone is actively on a mission
        if (['DELIVERING', 'RETURNING'].includes(drone.status)) {
            return res.status(409).json({
                success: false,
                message: `Cannot update drone while it is ${drone.status}.`
            });
        }

        const updatedDrone = await Drone.findByIdAndUpdate(droneId, updates, {
            new: true,
            runValidators: true
        });

        logger.info(`Drone ${droneId} was updated.`);
        res.json({ success: true, message: 'Drone updated successfully', data: updatedDrone });

    } catch (err) {
        logger.error(`Error updating drone ${req.params.id}: ${err.message}`);
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update a drone's status
// @route   PATCH /api/v1/drones/:id/status
// @access  Admin/System
exports.updateDroneStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required.' });
        }

        const drone = await Drone.findById(req.params.id);
        if (!drone) {
            return res.status(404).json({ success: false, message: 'Drone not found' });
        }

        drone.status = status;
        await drone.save();

        logger.info(`Drone ${drone._id} status updated to ${status}`);
        res.json({ success: true, data: drone });
    } catch (err) {
        logger.error(`Error updating drone status: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}

// @desc    Delete a drone
// @route   DELETE /api/v1/drones/:id
// @access  Admin
exports.deleteDrone = async (req, res) => {
    try {
        const droneId = req.params.id;
        const drone = await Drone.findById(droneId);

        if (!drone) {
            logger.warn(`Delete failed. Drone not found with ID: ${droneId}`);
            return res.status(404).json({ success: false, message: 'Drone not found' });
        }

        // Prevent deletion if the drone is not in a deletable state
        if (['DELIVERING', 'RETURNING'].includes(drone.status)) {
            return res.status(409).json({
                success: false,
                message: `Cannot delete a drone that is currently ${drone.status}.`
            });
        }

        await drone.deleteOne();

        logger.info(`Drone ${droneId} was deleted.`);
        res.json({ success: true, message: 'Drone deleted successfully' });
    } catch (err) {
        logger.error(`Error deleting drone ${req.params.id}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get available drones for a new mission
// @route   GET /api/v1/drones/available
// @access  System
exports.getAvailableDrones = async (req, res) => {
    try {
        // Find drones that are idle and have enough battery
        const availableDrones = await Drone.find({
            status: 'IDLE',
            batteryLevel: { $gt: 25 } // Example threshold: must have > 25% battery
        }).sort({ batteryLevel: -1 });

        if (availableDrones.length === 0) {
            logger.warn('No available drones for new mission.');
            return res.status(404).json({ success: false, message: 'No drones are currently available.' });
        }

        res.json({
            success: true,
            count: availableDrones.length,
            data: availableDrones
        });
    } catch (err) {
        logger.error(`Error fetching available drones: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}