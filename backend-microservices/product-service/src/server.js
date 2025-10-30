require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const productRoutes = require("./routes/product-routes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3002;

mongoose.connect(process.env.MONGO_URI).then(() => logger.info("Connected to MongoDB")).catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
});


const rateLimiter = async (req, res, next) => {
    const ip = req.ip;
    const windowSizeInSeconds = 60; 
    const maxRequests = 100; 
    const key = `rate-limit:${ip}`;

    try {
        const [count] = await redisClient.multi().incr(key).expire(key, windowSizeInSeconds, 'NX').exec();

        if (count[1] > maxRequests) {
            logger.warn(`Rate limit exceeded for IP: ${ip}`);
            return res.status(429).json({
                success: false,
                message: "Too many requests, please try again later."
            });
        }

        next();
    } catch (error) {
        logger.error("Error in rate limiter middleware:", error);
        next();
    }
};


app.use(rateLimiter);

//routes -> pass redisclient to routes
app.use('/api/products', (req, res, next) =>{
    req.redisClient = redisClient;
    next();
}, productRoutes);

app.use(errorHandler);

app.listen(PORT, () =>{
    logger.info(`Server is running on port ${PORT}`);
});

process.on("unhandledRejection", (reason, promise) =>{
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

