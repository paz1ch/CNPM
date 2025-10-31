const mongoose = require('mongoose');
const { add } = require('winston');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    CustomerID: { type: String, required: true },
    RestaurantID: { type: String, required: true },
    Items: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    TotalAmount: { type: Number, required: true },
    Status: { type: String, enum: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Pending' },
    deliveryPersonID: { type: String },
    location: {
        address: { type: String, required: true },
        coordinates: {
            type: { type: String, enum: ['Point'], required: true },
            coordinates: { type: [Number], required: true } // [longitude, latitude]
        }
    },
    paymentIntentID: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);