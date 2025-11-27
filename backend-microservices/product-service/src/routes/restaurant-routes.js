const express = require('express');
const { createRestaurant, getAllRestaurants, getRestaurantById } = require('../controllers/restaurant-controller');
const { protect, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, checkRole(['admin', 'restaurant']), createRestaurant);
router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantById);

module.exports = router;
