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
            return res.status(403).json({ message: 'Forbidden: You do not have access to this order' });
        }
    }
}