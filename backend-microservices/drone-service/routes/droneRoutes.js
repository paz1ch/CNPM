const express = require('express');
const router = express.Router();
const {
    getDrones,
    getDroneById,
    addDrone,
    updateDrone,
    deleteDrone,
    updateDroneStatus,
    getAvailableDrones
} = require('../controllers/droneController');

// Route for getting available drones must be before /:id
router.get('/available', getAvailableDrones);

router.route('/')
    .get(getDrones)
    .post(addDrone);

router.route('/:id')
    .get(getDroneById)
    .put(updateDrone)
    .delete(deleteDrone);

router.patch('/:id/status', updateDroneStatus);

module.exports = router;
