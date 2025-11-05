const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const orderController = require('../controllers/order-controller');
const validateRequest = require('../middleware/validateRequest');
const { protect, isUser, isRestaurant, isDelivery } = require('../middleware/authMiddleware');

// Create order validation
const createOrderValidation = [
    body('restaurantID').notEmpty().withMessage('Restaurant ID is required'),
    body('items').isArray().notEmpty().withMessage('Items are required'),
    body('items.*.menuItemId').notEmpty().withMessage('Menu item ID is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

// Modify order validation
const modifyOrderValidation = [
    param('id').notEmpty().withMessage('Order ID is required'),
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

// Update order validation
const updateOrderValidation = [
    param('id').notEmpty().withMessage('Order ID is required'),
    body('status').optional().isIn(['Preparing', 'Ready', 'Out for Delivery', 'Delivered']).withMessage('Invalid status'),
    body('delivery_person_id').optional().isString().withMessage('Invalid delivery person id'),
    body('delivery_person_name').optional().isString().withMessage('Invalid delivery person name'),
];

// Routes
router.post('/', protect, isUser, createOrderValidation, validateRequest, orderController.createOrder);
router.get('/user', protect, isUser, orderController.getOrdersByUser);
router.get('/restaurant/:restaurantId', protect, isRestaurant, orderController.getOrdersByRestaurant);
router.get('/postal-code/:postalCode', protect, isDelivery, orderController.getOrdersByPostalCode);
router.get('/:id', protect, orderController.getOrderById);
router.put('/:id/status', protect, updateStatusValidation, validateRequest, orderController.updateOrderStatus);
router.put('/:id/update', protect, isRestaurant || isDelivery, updateOrderValidation, validateRequest, orderController.updateOrder);
router.put('/:id', protect, isUser, modifyOrderValidation, validateRequest, orderController.modifyPendingOrder);

module.exports = router;