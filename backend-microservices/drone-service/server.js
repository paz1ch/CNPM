const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const droneController = require('./controllers/droneController');
const connectRabbitMQ = require('./rabbitmq/consumer');
const logger = require('./utils/logger');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/food-delivery';

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'drone-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes
app.get('/api/drones', droneController.getDrones);
app.post('/api/drones', droneController.addDrone);
app.get('/api/drones/delivery/:orderId', droneController.getDeliveryStatus);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        logger.info('Connected to MongoDB', { database: MONGO_URI.split('@')[1] });

        // Start RabbitMQ Consumer
        connectRabbitMQ().catch(err => {
            logger.error('Failed to connect to RabbitMQ', { error: err.message });
        });

        app.listen(PORT, () => {
            logger.info(`Drone Service running on port ${PORT}`);
        });
    })
    .catch(err => {
        logger.error('MongoDB connection error', { error: err.message });
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    mongoose.connection.close(() => {
        logger.info('MongoDB connection closed');
        process.exit(0);
    });
});
