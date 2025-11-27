const mongoose = require('mongoose');
const Product = require('../models/Product');
const Restaurant = require('../models/Restaurant');
require('dotenv').config();

const inspectData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const restaurants = await Restaurant.find();
        console.log(`Found ${restaurants.length} restaurants.`);

        for (const r of restaurants) {
            const productCount = await Product.countDocuments({ restaurantId: r._id });
            console.log(`Restaurant: ${r.name} | ID: ${r._id} | Owner: ${r.ownerId} | Products: ${productCount}`);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

inspectData();
