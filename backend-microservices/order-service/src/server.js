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

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    next();
});

// Routes
app.use('/api/orders', orderRoutes);

// Error handler
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        logger.info('Ket noi db thanh cong');

        async function startServer() {
            try {
                await connectToRabbitMQ();
                app.listen(PORT, () => {
                    logger.info(`Order service running on port ${PORT}`);
                });
            } catch (error) {
                logger.error('Failed to start server', error);
                process.exit(1);
            }
        }

        startServer();
    })
    .catch(e => {
        logger.error("Ket noi db that bai", e);
        process.exit(1);
    });

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at', promise, "reason: ", reason);
});