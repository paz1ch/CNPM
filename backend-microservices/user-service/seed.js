const mongoose = require('mongoose');
const User = require('./src/models/user');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const adminExists = await User.findOne({ role: 'admin' });

        if (!adminExists) {
            const admin = new User({
                username: 'admin',
                email: 'admin@example.com',
                password: process.env.ADMIN_PASSWORD || 'admin123',
                role: 'admin',
            });
            await admin.save();
            console.log('admin duoc tao thanh cong');
        } else {
            console.log('ten tai khoan admin da ton tai');
        }
    } catch (error) {
        console.error('loi khi tao admin', error);
    } finally {
        mongoose.disconnect();
    }
};

seedAdmin();
