
const express = require('express');
const { createPayment, getPaymentByOrderId } = require('../controllers/payment-controller');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createPayment);
router.get('/:orderId', protect, getPaymentByOrderId);

module.exports = router;
