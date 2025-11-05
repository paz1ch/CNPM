
const Payment = require('../models/payment');
const logger = require('../utils/logger');

const createPayment = async (req, res) => {
  logger.info('Create payment endpoint hit...');
  try {
    const { orderId, paymentMethod, amount } = req.body;

    const payment = new Payment({
      orderId,
      paymentMethod,
      amount,
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      payment,
    });
  } catch (e) {
    logger.error('Create payment error occurred: ', e);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const getPaymentByOrderId = async (req, res) => {
  logger.info('Get payment by order id endpoint hit...');
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (e) {
    logger.error('Get payment by order id error occurred: ', e);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = { createPayment, getPaymentByOrderId };
