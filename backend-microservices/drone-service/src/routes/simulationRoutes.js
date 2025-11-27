const express = require('express');
const router = express.Router();
const Drone = require('../models/Drone');
const logger = require('../utils/logger');

// POST /api/v1/simulation/move-drones
// Simulate drone movement for testing
router.post('/move-drones', async (req, res) => {
    try {
        const { publishToQueue } = require('../rabbitmq/publisher');
        const Mission = require('../models/Mission');

        // Find active drones with missions
        const drones = await Drone.find({ status: 'DELIVERING' }).populate('mission');
        let movedCount = 0;
        let deliveredCount = 0;

        for (const drone of drones) {
            if (!drone.mission) continue;

            const target = drone.mission.deliveryLocation;
            const current = drone.currentLocation;

            // Calculate vector to target
            const dx = target.lat - current.lat;
            const dy = target.lng - current.lng;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Speed factor (0.005 degrees approx 500m per tick)
            const speed = 0.005;

            if (distance < speed) {
                // ARRIVED!
                drone.currentLocation = target;
                drone.status = 'IDLE';
                drone.mission = null; // Clear mission from drone

                // Update Mission status
                await Mission.findByIdAndUpdate(drone.mission._id, { status: 'COMPLETED' });

                // Publish ORDER_DELIVERED event
                await publishToQueue('ORDER_DELIVERED', {
                    orderId: drone.mission.orderId,
                    droneId: drone._id,
                    timestamp: new Date().toISOString()
                });

                deliveredCount++;
            } else {
                // Move towards target
                const ratio = speed / distance;
                drone.currentLocation.lat += dx * ratio;
                drone.currentLocation.lng += dy * ratio;
                drone.batteryLevel = Math.max(0, drone.batteryLevel - 0.5);
                movedCount++;
            }

            await drone.save();
        }

        res.json({
            success: true,
            message: `Simulation step: ${movedCount} moving, ${deliveredCount} delivered`,
            stats: { moved: movedCount, delivered: deliveredCount }
        });
    } catch (err) {
        logger.error('Simulation error:', err);
        res.status(500).json({ success: false, message: 'Simulation failed' });
    }
});

module.exports = router;
