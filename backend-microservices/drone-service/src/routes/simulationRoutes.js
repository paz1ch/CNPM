const express = require('express');
const router = express.Router();
const Drone = require('../models/Drone');
const logger = require('../utils/logger');

// POST /api/v1/simulation/move-drones
// Simulate drone movement for testing
router.post('/move-drones', async (req, res) => {
    try {
        // Simple simulation: update location of all active drones slightly
        const drones = await Drone.find({ status: 'DELIVERING' });

        for (const drone of drones) {
            // Random movement simulation
            drone.currentLocation.lat += (Math.random() - 0.5) * 0.001;
            drone.currentLocation.lng += (Math.random() - 0.5) * 0.001;
            drone.batteryLevel = Math.max(0, drone.batteryLevel - 0.5);
            await drone.save();
        }

        res.json({ success: true, message: `Moved ${drones.length} drones` });
    } catch (err) {
        logger.error('Simulation error:', err);
        res.status(500).json({ success: false, message: 'Simulation failed' });
    }
});

module.exports = router;
