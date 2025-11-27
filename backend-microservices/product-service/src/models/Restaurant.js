const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        type: String,
        required: true,
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    imageUrl: {
        type: String,
        default: 'https://via.placeholder.com/150'
    },
    ownerId: {
        type: String, // ID of the admin/restaurant owner
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', RestaurantSchema);
