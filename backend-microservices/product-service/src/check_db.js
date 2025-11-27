const mongoose = require('mongoose');
const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');
require('dotenv').config();

const checkDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const restaurants = await Restaurant.find();
        console.log('Restaurants:', restaurants.map(r => ({ id: r._id, name: r.name, ownerId: r.ownerId })));

        const products = await Product.find();
        console.log('Products:', products.map(p => ({ id: p._id, name: p.name, restaurantId: p.restaurantId })));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkDb();
