const express = require('express');
const router = express.Router();
const Mission = require('../models/Mission');
const missionManager = require('../managers/missionManager');
const logger = require('../utils/logger');

// GET /api/v1/missions
router.get('/', async (req, res) => {
    try {
        const missions = await Mission.find().populate('drone').sort({ createdAt: -1 });
        res.json({ success: true, count: missions.length, data: missions });
    } catch (err) {
        logger.error('Error fetching missions:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// GET /api/v1/missions/order/:orderId
router.get('/order/:orderId', async (req, res) => {
    try {
        const mission = await Mission.findOne({ orderId: req.params.orderId }).populate('drone');
        if (!mission) {
            return res.status(404).json({ success: false, message: 'Mission not found for this order' });
        }
        res.json({ success: true, data: mission });
    } catch (err) {
        logger.error('Error fetching mission by order:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// POST /api/v1/missions
router.post('/', async (req, res) => {
    try {
        const result = await missionManager.assignMission(req.body);
        if (result.success) {
            res.status(201).json({ success: true, data: result.mission });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (err) {
        logger.error('Error creating mission:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// PATCH /api/v1/missions/:id/status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const mission = await Mission.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!mission) return res.status(404).json({ success: false, message: 'Mission not found' });
        res.json({ success: true, data: mission });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/v1/missions/:id
router.delete('/:id', async (req, res) => {
    try {
        await Mission.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Mission deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
