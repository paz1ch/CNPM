const logger = require('../utils/logger');
const Order = require('../models/order');
const { validateToken } = require('../utils/validateUser');
const { getMenuItemsDetails, getRestaurantDetails } = require('../utils/menuService');

/** Create a new order */
const createOrder = async (req, res) => {
    try {
        const token = req.cookies && req.cookies.token;
        const user = await validateToken(token);

        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        if (user.role !== 'user') return res.status(403).json({ message: 'Only users can place orders' });

        const { restaurantID, items } = req.body || {};
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Invalid order data' });
        }

        const restaurantDetails = await getRestaurantDetails(restaurantID);
        if (!restaurantDetails) return res.status(400).json({ message: 'Invalid restaurant ID' });

        const postal_code_of_restaurant = restaurantDetails.postal_code;
        const orderID = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const orderItems = [];
        const menuItemDetails = [];
        let totalAmount = 0;

        for (const item of items) {
            try {
                const menuItem = await getMenuItemsDetails(item.menuItemId);
                if (!menuItem) throw new Error('Menu item not found');

                menuItemDetails.push(menuItem);

                const orderItem = {
                    orderItemID: `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: menuItem.price,
                    totalPrice: menuItem.price * item.quantity,
                };

                totalAmount += orderItem.totalPrice;
                orderItems.push(orderItem);
            } catch (err) {
                return res.status(400).json({ message: `Error processing item ${item.menuItemId}: ${err.message}` });
            }
        }

        const order = await Order.create({
            orderID,
            userID: user.userID || user.id || user._id,
            restaurantID,
            items: orderItems,
            totalAmount,
            status: 'Pending',
            postal_code_of_restaurant,
            paymentStatus: 'Unpaid',
            modification_deadline: new Date(Date.now() + 30 * 60000),
        });

        return res.status(201).json({ orderDetails: order, restaurant: restaurantDetails, menuItems: menuItemDetails });
    } catch (error) {
        logger.error('Error creating order: %o', error);
        return res.status(500).json({ message: 'Failed to create order' });
    }
};

/** Get order by id */
const getOrderById = async (req, res) => {
    try {
        const token = req.cookies && req.cookies.token;
        const user = await validateToken(token);
        if (!user) return res.status(401).json({ message: 'Unauthorized user not found' });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (user.role === 'user' && order.userID !== user.userID && order.userID !== (user.id || user._id)) {
            return res.status(403).json({ message: "Unauthorized to view this order" });
        }
        if (user.role === 'restaurant' && order.restaurantID !== user.restaurantID) {
            return res.status(403).json({ message: "Unauthorized to view this order" });
        }

        try {
            const restaurantDetails = await getRestaurantDetails(order.restaurantID);
            if (order._doc) order._doc.restaurantDetails = restaurantDetails;
        } catch (err) {
            logger.error('Error fetching restaurant details: %o', err);
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
        const token = req.cookies && req.cookies.token;
        const user = await validateToken(token);
        if (!user) return res.status(401).json({ message: 'Unauthorized user not found' });

        const orderId = req.params.id;
        const order = await Order.findOne({ orderID: orderId });
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Validate permissions based on role
        if (user.role === 'user') {
            if (req.body.status !== 'Cancelled') return res.status(403).json({ message: 'Users can only cancel orders' });
            if (order.status !== 'Pending') return res.status(400).json({ message: 'Only pending orders can be cancelled' });
        } else if (user.role === 'restaurant') {
            if (!['Preparing', 'Ready', 'Completed'].includes(req.body.status)) {
                return res.status(403).json({ message: 'Restaurants can only update status to Preparing, Ready, or Completed' });
            }
            if (req.body.status === 'Completed' && order.status !== 'Ready') {
                return res.status(400).json({ message: 'Order must be Ready before marking as Completed' });
            }
        } else if (user.role === 'delivery') {
            if (!['Out for Delivery', 'Delivered'].includes(req.body.status)) {
                return res.status(403).json({ message: 'Delivery personnel can only update status to Out for Delivery or Delivered' });
            }
            if (req.body.status === 'Delivered' && order.status !== 'Out for Delivery') {
                return res.status(400).json({ message: 'Order must be Out for Delivery before marking as Delivered' });
            }
        }

        // Allowed transitions map
        const statusFlow = {
            Pending: ['Cancelled', 'Preparing'],
            Preparing: ['Ready'],
            Ready: ['Out for Delivery'],
            'Out for Delivery': ['Delivered'],
            Delivered: [],
            Cancelled: [],
        };

        const allowedNext = statusFlow[order.status] || [];
        if (req.body.status !== 'Cancelled' && !allowedNext.includes(req.body.status)) {
            return res.status(400).json({ message: `Invalid status transition from ${order.status} to ${req.body.status}` });
        }

        order.status = req.body.status;
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
        const token = req.cookies && req.cookies.token;
        const user = await validateToken(token);
        if (!user) return res.status(401).json({ message: 'Unauthorized from getUserOrder' });

        const orders = await Order.find({ userID: user.userID }).sort({ createdAt: -1 });

        for (let i = 0; i < orders.length; i++) {
            try {
                const restaurantDetails = await getRestaurantDetails(orders[i].restaurantID);
                if (orders[i]._doc) orders[i]._doc.restaurantDetails = restaurantDetails;
            } catch (err) {
                logger.error('Error fetching restaurant details for order %s: %o', orders[i]._id, err);
                if (orders[i]._doc) orders[i]._doc.restaurantDetails = null;
            }

            if (orders[i].items && orders[i].items.length > 0) {
                for (let j = 0; j < orders[i].items.length; j++) {
                    try {
                        const menuItemDetails = await getMenuItemsDetails(orders[i].items[j].menuItemId);
                        orders[i].items[j]._doc = {
                            ...orders[i].items[j]._doc,
                            name: menuItemDetails.name,
                            image_url: menuItemDetails.image_url,
                            description: menuItemDetails.description,
                        };
                    } catch (err) {
                        logger.error('Error fetching menu item details for order item %s: %o', orders[i].items[j]._id, err);
                    }
                }
            }
        }

        return res.status(200).json({ orders });
    } catch (error) {
        logger.error('Error fetching user orders: %o', error);
        return res.status(500).json({ message: 'Failed to fetch user orders' });
    }
};

/** Get orders by restaurant */
const getOrdersByRestaurant = async (req, res) => {
    try {
        const token = req.cookies && req.cookies.token;
        const user = await validateToken(token);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        if (user.role !== 'restaurant') return res.status(403).json({ message: 'Only restaurants can view their orders' });

        const restaurantID = req.params.restaurantId || user.restaurantID;

        let restaurantDetails = null;
        try {
            restaurantDetails = await getRestaurantDetails(restaurantID);
        } catch (err) {
            logger.error('Error fetching restaurant details: %o', err);
        }

        const orders = await Order.find({
            restaurantID,
            status: { $in: ['Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'] },
        }).sort({ createdAt: -1 });

        for (let i = 0; i < orders.length; i++) {
            if (orders[i].items && orders[i].items.length > 0) {
                for (let j = 0; j < orders[i].items.length; j++) {
                    try {
                        const menuItemDetails = await getMenuItemsDetails(orders[i].items[j].menuItemId);
                        orders[i].items[j]._doc = {
                            ...orders[i].items[j]._doc,
                            name: menuItemDetails.name,
                            image_url: menuItemDetails.image_url,
                            description: menuItemDetails.description,
                        };
                    } catch (err) {
                        logger.error('Error fetching menu item details for order item %s: %o', orders[i].items[j]._id, err);
                    }
                }
            }
        }

        const response = { restaurant: restaurantDetails || null, orders };
        return res.status(200).json(response);
    } catch (error) {
        logger.error('Error fetching restaurant orders: %o', error);
        return res.status(500).json({ message: 'Failed to fetch restaurant orders' });
    }
};

/** Get orders by postal code */
const getOrdersByPostalCode = async (req, res) => {
    try {
        const token = req.cookies && req.cookies.token;
        const user = await validateToken(token);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { postalCode } = req.params;
        const query = { postal_code_of_restaurant: postalCode, status: 'Prepared' };

        const orders = await Order.find(query).sort({ createdAt: -1 });

        const ordersWithRestaurantDetails = await Promise.all(
            orders.map(async (ord) => {
                const orderObj = ord.toObject();
                try {
                    orderObj.restaurantDetails = await getRestaurantDetails(ord.restaurantID);
                } catch (err) {
                    logger.error('Error fetching restaurant details for order %s: %o', ord.orderID || ord._id, err);
                    orderObj.restaurantDetails = null;
                }
                return orderObj;
            })
        );

        return res.status(200).json({ ordersWithRestaurantDetails });
    } catch (error) {
        logger.error('Error fetching orders by postal code: %o', error);
        return res.status(500).json({ message: 'Failed to fetch orders by postal code' });
    }
};

/** Modify pending order (user) */
const modifyPendingOrder = async (req, res) => {
    try {
        const token = req.cookies && req.cookies.token;
        const user = await validateToken(token);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });
        if (user.role !== 'user') return res.status(403).json({ message: 'Only users can modify orders' });

        const order = await Order.findOne({ orderID: req.params.id });
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.status !== 'Pending') return res.status(400).json({ message: 'Only pending orders can be modified' });
        if (order.userID !== user.userID && order.userID !== (user.id || user._id)) {
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
            try {
                const menuItem = await getMenuItemsDetails(item.menuItemId);
                if (!menuItem) throw new Error('Menu item not found');

                const orderItem = {
                    orderItemID: item.orderItemID || `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: menuItem.price,
                    totalPrice: menuItem.price * item.quantity,
                };

                totalAmount += orderItem.totalPrice;
                orderItems.push(orderItem);
            } catch (err) {
                return res.status(400).json({ message: `Invalid menu item: ${item.menuItemId}` });
            }
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

module.exports = {
    createOrder,
    getOrderById,
    updateOrderStatus,
    getOrdersByUser,
    getOrdersByRestaurant,
    getOrdersByPostalCode,
    modifyPendingOrder,
};