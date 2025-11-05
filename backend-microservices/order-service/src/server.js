const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const orderRoutes = require('./routes/order-routes');

// Load environment variables
require('dotenv').config();

// Validate required env vars
const requiredEnvVars = ['MONGO_URI', 'AUTH_SERVICE_URL', 'RESTAURANT_SERVICE_URL'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Error handling
app.use(errorHandler);

// Handle unhandled routes
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        logger.info('Connected to MongoDB');
        const PORT = process.env.PORT || 3003;
        app.listen(PORT, () => {
            logger.info(`Order Service running on port ${PORT}`);
        });
    })
    .catch((error) => {
        logger.error('Error connecting to MongoDB: %o', error);
        process.exit(1);
    });

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception: %o', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled Rejection: %o', error);
    process.exit(1);
});