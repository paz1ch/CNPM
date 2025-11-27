const express = require('express');
const router = express.Router();
const droneController = require('../controllers/droneController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Public routes (or protected if needed)
router.get('/', droneController.getDrones);
router.post('/', protect, isAdmin, droneController.addDrone); // Only admin can add drones
router.get('/delivery/:orderId', droneController.getDeliveryStatus);

module.exports = router;
