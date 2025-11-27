require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const connectRabbitMQ = require('./rabbitmq/consumer');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const droneRoutes = require('./routes/drone-routes');

const app = express();
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/food-delivery';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'drone-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes
app.use('/api/drones', droneRoutes);

// Error handling
app.use(errorHandler);

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
