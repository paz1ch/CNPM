const Mission = require('../models/Mission');
const Drone = require('../models/Drone');
const logger = require('../utils/logger');
const missionManager = require('../managers/missionManager');

// @desc    Get all missions
// @route   GET /api/v1/missions
// @access  Public
exports.getMissions = async (req, res) => {
    try {
        const { status, droneId } = req.query;
        const filter = {};

        if (status) {
            filter.status = status;
        }
        if (droneId) {
            filter.drone = droneId;
        }

        const missions = await Mission.find(filter)
            .populate('drone', 'name model status batteryLevel')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: missions.length,
            data: missions
        });
    } catch (err) {
        logger.error(`Error fetching missions: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get a single mission by ID
// @route   GET /api/v1/missions/:id
// @access  Public
exports.getMissionById = async (req, res) => {
    try {
        const mission = await Mission.findById(req.params.id)
            .populate('drone', 'name model status batteryLevel currentLocation');

        if (!mission) {
            logger.warn(`Mission not found with ID: ${req.params.id}`);
            return res.status(404).json({ success: false, message: 'Mission not found' });
        }

        res.json({ success: true, data: mission });
    } catch (err) {
        logger.error(`Error fetching mission ${req.params.id}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get mission status by Order ID
// @route   GET /api/v1/missions/order/:orderId
// @access  Public
exports.getMissionByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;
        const mission = await Mission.findOne({ orderId })
            .populate('drone', 'name model status batteryLevel currentLocation');

        if (!mission) {
            return res.status(404).json({ 
                success: false, 
                message: 'Mission not found for this order. It may be pending or have failed to assign.' 
            });
        }

        res.json({ success: true, data: mission });

    } catch (err) {
        logger.error(`Error fetching mission for order ${req.params.orderId}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Request a new drone mission
// @route   POST /api/v1/missions
// @access  System/Admin
exports.createMission = async (req, res) => {
    const { orderId, pickupLocation, deliveryLocation } = req.body;

    if (!orderId || !pickupLocation || !deliveryLocation) {
        return res.status(400).json({ success: false, message: 'Missing required mission parameters: orderId, pickupLocation, deliveryLocation' });
    }

    try {
        const result = await missionManager.assignMission({ orderId, pickupLocation, deliveryLocation });

        if (!result.success) {
            logger.warn(`Mission assignment failed for Order ${orderId}: ${result.message}`);
            return res.status(409).json(result);
        }

        logger.info(`Mission successfully assigned for Order ${orderId}. Drone: ${result.data.drone._id}`);
        res.status(201).json(result);

    } catch (err) {
        logger.error(`Critical error in createMission for Order ${orderId}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Failed to create mission due to an internal error.' });
    }
};

// @desc    Update a mission's status
// @route   PATCH /api/v1/missions/:id/status
// @access  System/Drone
exports.updateMissionStatus = async (req, res) => {
    const { id } = req.params;
    const { status, failureReason, message } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    try {
        const result = await missionManager.updateMissionLifecycle(id, status, { failureReason, message });

        if (!result.success) {
            return res.status(result.status || 404).json({ success: false, message: result.message });
        }
        
        res.json(result);

    } catch (err) {
        logger.error(`Error updating status for mission ${id}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Cancel a mission
// @route   DELETE /api/v1/missions/:id
// @access  Admin
exports.cancelMission = async (req, res) => {
    try {
        const missionId = req.params.id;
        const result = await missionManager.cancelMission(missionId, 'Cancelled by admin');

        if (!result.success) {
             return res.status(result.status || 404).json({ success: false, message: result.message });
        }
        
        logger.info(`Mission ${missionId} was cancelled by an admin.`);
        res.json(result);

    } catch (err) {
        logger.error(`Error cancelling mission ${req.params.id}: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};