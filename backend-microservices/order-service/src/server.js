require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const orderRoutes = require('./routes/order-routes');
const { connectToRabbitMQ } = require('./utils/rabbitmq');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3003;

let isReady = false;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    if (isReady) {
        res.status(200).json({ status: 'UP' });
    } else {
        res.status(503).json({ status: 'STARTING' });
    }
});

// Readiness check middleware for API routes
app.use('/api/orders', (req, res, next) => {
    if (!isReady) {
        return res.status(503).json({ message: 'Service is starting up, please try again later.' });
    }
    next();
}, orderRoutes);

// Error handler
app.use(errorHandler);

// Connect to MongoDB with retry
const connectToDB = async () => {
    const retries = 10;
    const interval = 5000;
    for (let i = 0; i < retries; i++) {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            logger.info('Connected to MongoDB');
            return true;
        } catch (err) {
            logger.error(`Failed to connect to MongoDB (Attempt ${i + 1}/${retries}): ${err.message}`);
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
    logger.error('Could not connect to MongoDB after multiple retries.');
    return false;
};

// Start Server
async function startServer() {
    app.listen(PORT, () => {
        logger.info(`Order service running on port ${PORT}`);
    });

    const dbConnected = await connectToDB();
    if (!dbConnected) {
        logger.error('Exiting due to DB connection failure');
        // process.exit(1); // Don't exit, keep container running for debugging? Or exit to let Docker restart?
        // If we keep it running, at least logs are accessible and DNS works.
        return;
    }

    try {
        await connectToRabbitMQ();
        isReady = true;
        logger.info('Order Service is READY');
    } catch (error) {
        logger.error('Failed to connect to RabbitMQ', error);
        // Keep running but not ready
    }
}

startServer();

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at', promise, "reason: ", reason);
});