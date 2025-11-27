const express = require('express');
const router = express.Router();
const droneController = require('../controllers/droneController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Public routes (or protected if needed)
// Public routes (or protected if needed)
router.get('/', droneController.getDrones);
router.post('/', protect, isAdmin, droneController.addDrone); // Only admin can add drones
router.get('/available', droneController.getAvailableDrones); // Check available drones
router.get('/delivery/:orderId', droneController.getDeliveryStatus);

// Admin only routes for managing drones
router.put('/:id', protect, isAdmin, droneController.updateDrone);
router.patch('/:id/status', protect, isAdmin, droneController.updateDroneStatus);
router.delete('/:id', protect, isAdmin, droneController.deleteDrone);

module.exports = router;
