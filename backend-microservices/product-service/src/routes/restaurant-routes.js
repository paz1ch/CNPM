const express = require('express');
const { createRestaurant, getAllRestaurants, getRestaurantById } = require('../controllers/restaurant-controller');
const { protect, checkRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, checkRole(['admin', 'restaurant']), createRestaurant);
router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantById);
router.put('/:id', protect, checkRole(['admin', 'restaurant']), require('../controllers/restaurant-controller').updateRestaurant);
router.delete('/:id', protect, checkRole(['admin', 'restaurant']), require('../controllers/restaurant-controller').deleteRestaurant);

module.exports = router;
