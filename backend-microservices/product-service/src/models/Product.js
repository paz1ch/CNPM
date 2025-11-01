const mongoose = require('mongoose');



const addOnSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
});

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },

    isAvailable: {
        type: Boolean,
        default: true,
    },
    addOns: [addOnSchema],
    isVegetarian: {
        type: Boolean,
        default: false,
    },
    isHalal: {
        type: Boolean,
        default: false,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;