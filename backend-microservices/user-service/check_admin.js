const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const adminEmail = "admin@example.com";
        const user = await User.findOne({ email: adminEmail });

        if (user) {
            console.log(`User found: ${user.email}`);
            console.log(`Role: ${user.role}`);
            if (user.role !== 'admin') {
                console.log("User is NOT admin. Updating role...");
                user.role = 'admin';
            } else {
                console.log("User is already admin.");
            }
            // Always reset password to ensure we can login
            user.password = '1234567';
            await user.save();
            console.log("User password reset to '1234567'.");
        } else {
            console.log(`User ${adminEmail} not found.`);
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

checkAdmin();
