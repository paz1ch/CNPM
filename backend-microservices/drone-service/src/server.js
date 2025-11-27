require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

const { initWebSocketServer } = require('./websocket/websocket');
const { connectRabbitMQ } = require('./rabbitmq/consumer');
const { connectPublisher } = require('./rabbitmq/publisher');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// --- Route Imports ---
const droneRoutes = require('./routes/droneRoutes');
const missionRoutes = require('./routes/missionRoutes');
const simulationRoutes = require('./routes/simulationRoutes');

const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    logger.info(`--> ${req.method} ${req.originalUrl}`, { body: req.body });
    res.on('finish', () => {
        logger.info(`<-- ${req.method} ${req.originalUrl} ${res.statusCode}`);
    });
    next();
});

// --- API Routes ---
app.use('/api/v1/drones', droneRoutes);
app.use('/api/v1/missions', missionRoutes);
app.use('/api/v1/simulation', simulationRoutes);

// --- Health Check ---
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        service: 'drone-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        dbState: mongoose.STATES[mongoose.connection.readyState]
    });
});

// --- Centralized Error Handling ---
app.use((err, req, res, next) => {
    logger.error('Unhandled application error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'An unexpected error occurred.',
        error: process.env.NODE_ENV === 'production' ? {} : err.stack
    });
});

// --- Server Initialization ---
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/drone-delivery';

async function startServer() {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        logger.info(`Connected to MongoDB: ${mongoose.connection.host}`);

        // 2. Initialize WebSocket Server
        initWebSocketServer(server);

        // 3. Connect to RabbitMQ (Consumer & Publisher)
        await connectRabbitMQ();
        await connectPublisher();

        // 4. Start HTTP Server
        server.listen(PORT, () => {
            logger.info(`Drone Service is UP and running on port ${PORT}`);
        });

    } catch (error) {
        logger.error('Failed to start server', { error: error.message, stack: error.stack });
        process.exit(1);
    }
}

startServer();

// --- Graceful Shutdown ---
const gracefulShutdown = (signal) => {
    logger.warn(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
        logger.info('HTTP server closed.');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed.');
            process.exit(0);
        });
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));