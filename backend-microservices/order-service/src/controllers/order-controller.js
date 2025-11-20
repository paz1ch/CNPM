const logger = require('../utils/logger');
const Order = require('../models/order');
const { ORDER_MODIFICATION_DEADLINE, statusFlow } = require('../config/order');

/** Create a new order */
const createOrder = async (req, res) => {
    try {
        const user = req.user;

        const { restaurantID, items, postal_code_of_restaurant } = req.body || {};

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Invalid order data' });
        }

        if (!restaurantID) {
            return res.status(400).json({ message: 'Restaurant ID is required' });
        }

        if (!postal_code_of_restaurant) {
            return res.status(400).json({ message: 'Postal code is required' });
        }

        const orderID = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
            if (!item.menuItemId || !item.quantity || !item.price) {
                return res.status(400).json({
                    message: 'Each item must have menuItemId, quantity, and price'
                });
            }

            const orderItem = {
                orderItemID: `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.price * item.quantity,
            };

            totalAmount += orderItem.totalPrice;
            orderItems.push(orderItem);
        }

        const order = await Order.create({
            orderID,
            userID: user.userId,
            restaurantID,
            items: orderItems,
            totalAmount,
            status: 'Pending',
            postal_code_of_restaurant,
            paymentStatus: 'Unpaid',
            modification_deadline: new Date(Date.now() + ORDER_MODIFICATION_DEADLINE * 60000),
        });

        return res.status(201).json({ orderDetails: order });
    } catch (error) {
        logger.error('Error creating order: %o', error);
        logger.error('Error stack: %s', error.stack);
        logger.error('Error message: %s', error.message);
        return res.status(500).json({
            message: 'Failed to create order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/** Get order by id */
const getOrderById = async (req, res) => {
    try {
        const user = req.user;

        const order = await Order.findOne({ orderID: req.params.id });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (user.role === 'user' && order.userID.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to view this order" });
        }
        if (user.role === 'restaurant' && order.restaurantID !== user.restaurantID) {
            return res.status(403).json({ message: "Unauthorized to view this order" });
        }

        return res.status(200).json({ order });
    } catch (error) {
        logger.error('Error fetching order: %o', error);
        return res.status(500).json({ message: 'Failed to fetch order' });
    }
};

/** Update order status */
const updateOrderStatus = async (req, res) => {
    try {
        const user = req.user;

        const orderId = req.params.id;
        const order = await Order.findOne({ orderID: orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const { status } = req.body;

        const allowedNext = statusFlow[user.role]?.[order.status] || [];
        if (!allowedNext.includes(status)) {
            return res.status(400).json({ message: `Invalid status transition from ${order.status} to ${status}` });
        }

        order.status = status;
        await order.save();

        return res.status(200).json({ order });
    } catch (error) {
        logger.error('Error updating order status: %o', error);
        return res.status(500).json({ message: 'Failed to update order status' });
    }
};

/** Get orders by user */
const getOrdersByUser = async (req, res) => {
    try {
        const user = req.user;

        const orders = await Order.find({ userID: user._id }).sort({ createdAt: -1 });

        return res.status(200).json({ orders });
    } catch (error) {
        logger.error('Error fetching user orders: %o', error);
        return res.status(500).json({ message: 'Failed to fetch user orders' });
    }
};

/** Get orders by restaurant */
const getOrdersByRestaurant = async (req, res) => {
    try {
        const user = req.user;

        const restaurantID = req.params.restaurantId || user.restaurantID;

        const orders = await Order.find({
            restaurantID,
            status: { $in: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'] },
        }).sort({ createdAt: -1 });

        return res.status(200).json({ orders });
    } catch (error) {
        logger.error('Error fetching restaurant orders: %o', error);
        return res.status(500).json({ message: 'Failed to fetch restaurant orders' });
    }
};

/** Get orders by postal code */
const getOrdersByPostalCode = async (req, res) => {
    try {
        const { postalCode } = req.params;
        const query = { postal_code_of_restaurant: postalCode, status: 'Ready' };

        const orders = await Order.find(query).sort({ createdAt: -1 });

        return res.status(200).json({ orders });
    } catch (error) {
        logger.error('Error fetching orders by postal code: %o', error);
        return res.status(500).json({ message: 'Failed to fetch orders by postal code' });
    }
};

/** Modify pending order (user) */
const modifyPendingOrder = async (req, res) => {
    try {
        const user = req.user;

        const order = await Order.findOne({ orderID: req.params.id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'Pending') return res.status(400).json({ message: 'Only pending orders can be modified' });
        if (order.userID.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized to modify this order' });
        }

        if (Date.now() > new Date(order.modification_deadline).getTime()) {
            return res.status(400).json({ message: 'Modification time limit exceeded' });
        }

        const { items } = req.body;
        if (!items || !items.length) return res.status(400).json({ message: 'Order must contain at least one item' });

        const orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
            if (!item.menuItemId || !item.quantity || !item.price) {
                return res.status(400).json({ message: 'Each item must have menuItemId, quantity, and price' });
            }

            const orderItem = {
                orderItemID: item.orderItemID || `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.price * item.quantity,
            };

            totalAmount += orderItem.totalPrice;
            orderItems.push(orderItem);
        }

        order.items = orderItems;
        order.totalAmount = totalAmount;
        await order.save();
        return res.status(200).json(order);
    } catch (error) {
        logger.error('Error modifying order: %o', error);
        return res.status(500).json({ message: 'Failed to modify order' });
    }
};

/** Update order by restaurant or delivery */
const updateOrder = async (req, res) => {
    try {
        const user = req.user;

        const order = await Order.findOne({ orderID: req.params.id });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (user.role === 'restaurant' && order.restaurantID.toString() !== user.restaurantID.toString()) {
            return res.status(403).json({ message: 'Unauthorized to update this order' });
        }

        const { status, delivery_person_id, delivery_person_name } = req.body;

        if (status) {
            const allowedNext = statusFlow[user.role]?.[order.status] || [];
            if (!allowedNext.includes(status)) {
                return res.status(400).json({ message: `Invalid status transition from ${order.status} to ${status}` });
            }
            order.status = status;
        }

        if (delivery_person_id && user.role === 'delivery') {
            order.delivery_person_id = delivery_person_id;
        }

        if (delivery_person_name && user.role === 'delivery') {
            order.delivery_person_name = delivery_person_name;
        }

        await order.save();
        return res.status(200).json(order);
    } catch (error) {
        logger.error('Error updating order: %o', error);
        return res.status(500).json({ message: 'Failed to update order' });
    }
};

module.exports = {
    createOrder,
    getOrderById,
    updateOrderStatus,
    getOrdersByUser,
    getOrdersByRestaurant,
    getOrdersByPostalCode,
    modifyPendingOrder,
    updateOrder,
};
