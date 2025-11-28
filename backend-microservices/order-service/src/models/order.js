const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
    orderItemID: { type: String, required: true },
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
});

const OrderSchema = new Schema({
    orderID: { type: String, required: true, unique: true },
    userID: { type: String, required: true },
    restaurantID: { type: String, required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Pending' },
    postal_code_of_restaurant: { type: String, required: true },
    restaurantLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    customerLocation: {
        lat: { type: Number },
        lng: { type: Number }
    },
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
    modification_deadline: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);