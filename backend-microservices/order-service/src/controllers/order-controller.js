const logger = require('../utils/logger');
const Order = require('../models/order');
const validateToken = require('../utils/validateUser');
import order from '../models/order';
import { getMenuItemsDetails, getRestaurantDetails } from '../utils/menuService';

// Other controller methods...
export const creatOrder = async (req, res) => {
    const token = req.cookies.token;
    const user = await validateToken(token);

    console.log("User from token:", user);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role !== 'user') {return res.status(403).json({ message: 'Only users can place orders' });

    try {
        const{
            restaurantID,
            items
        } = req.body;
        // Fetch restaurant details to ensure it exists

        if(!items || !Array.isArray(items) || items.length === 0)
            return res.status(400).json({message: 'Invalid order data'});

        // Validate restaurant_id by fetching restaurant details
        const restaurantDetails2 = await getRestaurantDetails(restaurantID);

        if(!restaurantDetails2){
            return res.status(400).json({message: 'Invalid restaurant ID'});
        }

        const postal_code_of_restaurant = restaurantDetails2.postal_code;

        const orderID = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Process order items and validate with restaurant service
        const orderItems = [];
        const menuItemDetails = [];
        let totalAmount = 0;
    
        for (const item of items) {
            try {
                const menuItem = await getMenuItemsDetails(item.menuItemId);
            
                menuItemDetails.push(menuItem); // store menu item details for later use
            
                const orderItem = {
                    orderItemID: `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: menuItem.price,
                    totalPrice: menuItem.price * item.quantity
                };

                totalAmount += orderItem.totalPrice;
                orderItems.push(orderItem);
            } catch (error) {
                return res.status(400).json({ message: `Error processing item ${item.menuItemId}: ${error.message}` });
            }
        }

        const order = await Order.create({
            orderID,
            userID: user.userID,
            restaurantID,
            items: orderItems,
            totalAmount,
            status: 'Pending',
            postal_code_of_restaurant,
            paymentStatus: 'Unpaid',
            modification_deadline: new Date(Date.now() + 30 * 60000) // 30 minutes from now 
        });


        res.status(201).json({
            orderDetails: order,
            restaurant: restaurantDetails2,
            menuItems: menuItemDetails // send menu item details back to client
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Failed to create order' });
    }
};
}

export const getOrderById = async (req, res) => {
    const token = req.cookies.token;
    const user = await validateToken(token);

    if (!user) return res.status(401).json({ message: 'Unauthorized user not found' });

    try {
        const { orderId } = await Order.findById({orderId: req.params.id });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        //Check user permissions based on role
        if (user.role === 'user' && order.userID !== user.userID) {
            return res.status(403).json({ message: "Unauthorized to view this order" });
        } else if (user.role === 'restaurant' && order.restaurantID !== user.restaurantID) {
            return res.status(403).json({ message: "Unauthorized to view this order" });
        }

        // Get restaurant details
        try {
            const restaurantDetails = await getRestaurantDetails(order.restaurantID);
            order._doc.restaurantDetails = restaurantDetails; // Attach restaurant details to order
        } catch (error) {
            console.error("Error fetching restaurant details:", error);
            order._doc.restaurantDetails = null; // Proceed without restaurant details
        }

        res.status(200).json({ order });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Failed to fetch order' });
    }
};

export const updateOrderStatus = async (req, res) => {
    const token = req.cookies.token;
    const user = await validateToken(token);
    if (!user) return res.status(401).json({ message: 'Unauthorized user not found' });

    const orderId = req.params.id;
    console.log("Order ID to update:", orderId);

    try {
        const order = await Order.findOne({ orderID: orderId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        //Validate permissions based on role
        if (user.role === 'user') {
            if (req.body.status !== 'Cancelled') {
                return res.status(403).json({ message: 'Users can only cancel orders' });
            }
            if (order.status !== 'Pending') {
                return res.status(400).json({ message: 'Only pending orders can be cancelled' });
            }    
        } else if (user.role === 'restaurant') {
            // remove CONFIRMED from allowed statuses for sellers
            if (!['Preparing', 'Ready', 'Completed'].includes(req.body.status)) {
                return res.status(403).json({message: "Restaurants can only update status to Preparing, Ready, or Completed"});
            }

            // Special handling for APPROVED status
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

        // Validate status transitions
        const statusFlow = {
            'Pending': ['Cancelled', 'Preparing'],
            'Preparing': ['Ready'],
            'Ready': ['Out for Delivery'],
            'Out for Delivery': ['Delivered'],
            'Delivered': [],
            'Cancelled': []
        };
        const currentIndex = statusFlow.indexOf(order.status);
        const newIndex = statusFlow.indexOf(req.body.status);

        if (req.body.status === 'Cancelled')
        {
            // Special handling for cancellation
            if (user.role !== 'user' && order.status !== 'Pending') {
                return res.status(403).json({ message: 'Only users can cancel pending orders' });
            }
            if (user.role === 'restaurant' && !['Pending', 'Preparing'].includes(order.status)) {
                return res.status(403).json({ message: 'Restaurants can only cancel Pending or Preparing orders' });
            }
        } else if (newIndex <= currentIndex || newIndex - currentIndex > 1) {
            //Exception for seller approving a confirmed order
            if (!(user.role ==='restaurant' && order.status === 'confirmed' && req.body.status === 'aproved')) {
                // Ensure proper status progression (one step at a time)
                return res.status(400).json({ message: `Invalid status transition from ${order.status} to ${req.body.status}` });
            }
        }

        // update order status
        order.status = req.body.status;
        await order.save();
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Failed to update order status' });
    }
};

export const getOrdersByUser = async (req, res) => {
    const token = req.cookies.token;
    const user = await validateToken(token);
    if (!user) return res.status(401).json({ message: 'Unauthorized from getUserOrder' });

    try {
        // Find all orders for this user, sorted by most recent first
        const orders = await Order.find({ userID: user.userID }).sort({ createdAt: -1 });

        // For each order, fetch the restaurant details and menu item details
        for (let i = 0; i < orders.length; i++) {
            // Fetch restaurant details
            try {
                const restaurantDetails = await getRestaurantDetails(orders[i].restaurantID);
                orders[i]._doc.restaurantDetails = restaurantDetails; // Attach restaurant details to order
            } catch (error) {
                console.error("Error fetching restaurant details for order:", orders[i]._id, error);
                // Continue without restaurant details if there's an error
                orders[i]._doc.restaurantDetails = null; // Proceed without restaurant details
            }

            // Fetch menu item details for each item in the order
            if (orders[i].items && orders[i].items.length > 0) {
                for (let j = 0; j < orders[i].items.length; j++) {
                    try {
                        const menuItemDetails = await getMenuItemsDetails(orders[i].items[j].menuItemId);

                        // Add menu item name and image to the order item
                        orders[i].items[j]._doc ={
                            ...orders[i].items[j]._doc,
                            name: menuItemDetails.name,
                            image_url: menuItemDetails.image_url,
                            description: menuItemDetails.description
                        };
                    } catch (error) {
                        console.error("Error fetching menu item details for order item:", orders[i].items[j]._id, error);
                        // Continue without menu item details if there's an error
                    }
                }
            }
        }

    res.status(200).json({ orders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Failed to fetch user orders' });
    }
};

export const getOrdersByRestaurant = async (req, res) => {
    const token = req.cookies.token;
    const user = await validateToken(token);
    if (!user) return res.status(401).json({ message: 'Unauthorized'});
    if (user.role !== 'restaurant') return res.status(403).json({ message: 'Only restaurants can view their orders' });

    try {
        const restaurantID = req.params.restaurantId || user.restaurantID;
        
        // Fetch restaurant details
        let restaurantDetails;
        try {
            restaurantDetails = await getRestaurantDetails(restaurantID);
        } catch (error) {
            console.error("Error fetching restaurant details:", error);
             // Continue without restaurant details
        }

        // Modified query to only show confirmed or later status orders
        const orders = await Order.find({
            restaurantID,
            status: { $in: ['Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'] }
        }).sort({ createdAt: -1 });

        // For each order, fetch menu item details
        for (let i = 0; i < orders.length; i++) {
            if (orders[i].items && orders[i].items.length > 0) {
                for (let j = 0; j < orders[i].items.length; j++) {
                    try {
                        const menuItemDetails = await getMenuItemsDetails(orders[i].items[j].menuItemId);

                        // Add menu item name and image to the order item
                        orders[i].items[j]._doc ={
                            ...orders[i].items[j]._doc,
                            name: menuItemDetails.name,
                            image_url: menuItemDetails.image_url,
                            description: menuItemDetails.description
                        };
                    } catch (error) {
                        console.error("Error fetching menu item details for order item:", orders[i].items[j]._id, error);
                        // Continue without menu item details if there's an error
                    }
                }
            }
        }

        const response = {
            restaurant = restaurantDetails || null,
            orders = orders
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching restaurant orders:', error);
        res.status(500).json({ message: 'Failed to fetch restaurant orders' });
    }
};

export const getOrdersByPostalCode = async (req, res) => {
    const token = req.cookies.token;
    const user = await validateToken(token);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const { postalCode } = req.params;

        // Only fetch orders with status PREPARED
        const query = {
            postal_code_of_restaurant = postalCode,
            status: 'Prepared'
        };

        const orders = await Order.find(query).sort({ createdAt: -1 });

        // Fetch restaurant details for each order
        const ordersWithRestaurantDetails = await Promise.all(orders.map(async (order) => {
            const orderObj = order.toObject();
            try {
                orderObj.restaurantDetails = await getRestaurantDetails(order.restaurantID);
            } catch (error) {
                console.error(`Error fetching restaurant details for order ${order.order_id}:`, error)
            }
            return orderObj;
        }));

        res.status(200).json({ ordersWithRestaurantDetails });
    } catch (error) {
        console.error('Error fetching orders by postal code:', error);
        res.status(500).json({ message: 'Failed to fetch orders by postal code' });
    }
};

export const modifyPendingOrder = async (req, res) => {
    const token = req.cookies.token;
    const user = await validateToken(token);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role !== 'user') return res.status(403).json({ message: 'Only users can modify orders' });

    try {
        const order = await Order.findOne({ orderID: req.params.id });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending orders can be modified' });
        }

        if ( order.userID !== user.userID) {
            return res.status(403).json({ message: 'Unauthorized to modify this order' });
        }

        // Check if modification deadline has passed
        if (Date.now() > order.modification_deadline) {
            return res.status(400).json({ message: "Modification time limit exceeded" });
        }

        const {items} = req.body;

        if (!items || !items.length) {
            return res.status(400).json({ message: "Order must contain at least one item" });
        }

        // Process and validate new items
        const orderItems = [];
        let totalAmount = 0;

        for (const item of items) {
            try {
                // Fetch menu item details from restaurant service
                const menuItem = await getMenuItemsDetails(item.menuItemId)

                const orderItem = {
                    orderItemID: item.orderItemID || `ITEM-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    price: menuItem.price,
                    totalPrice: menuItem.price*item.quantity
                };

                totalAmount += orderItem.totalPrice;
                orderItems.push(orderItem);
            } catch (error){
                return res.status(400).json({ message: `Invalid menu item: ${item.menuItemId}` });
            }
        }

        order.items = orderItems;
        order.TotalAmount = totalAmount;

        await order.save();
        res.status(200).json(order);
    } catch (error){
        console.error('Error modifying order:', error);
        res.status(500).json({message: 'Failed to modify order'});
    }
};