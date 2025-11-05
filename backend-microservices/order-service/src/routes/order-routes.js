const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const orderController = require('../controllers/order-controller');
const validateRequest = require('../middleware/validateRequest');

// Create order validation
const createOrderValidation = [
    body('restaurantID').notEmpty().withMessage('Restaurant ID is required'),
    body('items').isArray().notEmpty().withMessage('Items are required'),
    body('items.*.menuItemId').notEmpty().withMessage('Menu item ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

// Update status validation
const updateStatusValidation = [
    param('id').notEmpty().withMessage('Order ID is required'),
    body('status').isIn(['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'])
        .withMessage('Invalid status'),
];

// Routes
router.post('/', createOrderValidation, validateRequest, orderController.createOrder);
router.get('/user', orderController.getOrdersByUser);
router.get('/restaurant/:restaurantId', orderController.getOrdersByRestaurant);
router.get('/postal-code/:postalCode', orderController.getOrdersByPostalCode);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', updateStatusValidation, validateRequest, orderController.updateOrderStatus);
router.put('/:id', orderController.modifyPendingOrder);

module.exports = router;