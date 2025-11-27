require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const logger = require('./utils/logger');
const proxy = require('express-http-proxy');
const errorHandler = require('./middleware/errorHandler');
const { validateToken, attachUser } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(attachUser);

//rate limiting
const ratelimitOptions = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`sensitive endpoint rate limit exceeded for ip: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    }),
});

app.use(ratelimitOptions);

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${JSON.stringify(req.body)}`);
    next();
});

const proxyOptions = {
    // Map incoming `/v1/...` routes to backend services' routes which are
    // defined under `/api/v1/...` in service implementations.
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api/v1");
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error: ${err.message}`);
        res.status(500).json({
            message: `Internal server error: ${err.message}`,
            error: err.message
        })
    },
    proxyReqBodyDecorator: function (bodyContent, srcReq) {
        if (typeof bodyContent === 'object') {
            return JSON.stringify(bodyContent);
        }
        return bodyContent;
    }
};


//setting proxy for user service
app.use('/v1/auth', proxy(process.env.USER_SERVICE_URL, {
    ...proxyOptions,
    proxyReqPathResolver: (req) => {
        // User service mounts auth routes under /api/auth (no v1)
        return req.originalUrl.replace(/^\/v1\/auth/, "/api/auth");
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-type"] = "application/json";
        if (srcReq.user) {
            proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
            proxyReqOpts.headers["x-user-role"] = srcReq.user.role;
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from user service: ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

//setting up proxy for product service
app.use('/v1/products', proxy(process.env.PRODUCT_SERVICE_URL, {
    ...proxyOptions,
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1\/products/, "/api/products");
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-type"] = "application/json";
        if (srcReq.user) {
            proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
            proxyReqOpts.headers["x-user-role"] = srcReq.user.role;
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Product service: ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

//setting up proxy for restaurant service (part of product service)
app.use('/v1/restaurants', proxy(process.env.PRODUCT_SERVICE_URL, {
    ...proxyOptions,
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1\/restaurants/, "/api/restaurants");
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-type"] = "application/json";
        if (srcReq.user) {
            proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
            proxyReqOpts.headers["x-user-role"] = srcReq.user.role;
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Restaurant service: ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

//setting up proxy for order service
app.use('/v1/orders', proxy(process.env.ORDER_SERVICE_URL, {
    ...proxyOptions,
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1\/orders/, "/api/orders");
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-type"] = "application/json";
        if (srcReq.user) {
            proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
            proxyReqOpts.headers["x-user-role"] = srcReq.user.role;
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Order service: ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

//setting up proxy for payment service
app.use('/v1/payment', proxy(process.env.PAYMENT_SERVICE_URL, {
    ...proxyOptions,
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1\/payment/, "/api/payment");
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-type"] = "application/json";
        if (srcReq.user) {
            proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
            proxyReqOpts.headers["x-user-role"] = srcReq.user.role;
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Payment service: ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

//setting up proxy for drone service
app.use('/v1/drones', proxy(process.env.DRONE_SERVICE_URL || 'http://drone-service:3005', {
    ...proxyOptions,
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1\/drones/, "/api/v1/drones");
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-type"] = "application/json";
        if (srcReq.user) {
            proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
            proxyReqOpts.headers["x-user-role"] = srcReq.user.role;
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Drone service (drones): ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

//setting up proxy for missions (handled by drone service)
app.use('/v1/missions', proxy(process.env.DRONE_SERVICE_URL || 'http://drone-service:3005', {
    ...proxyOptions,
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1\/missions/, "/api/v1/missions");
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-type"] = "application/json";
        if (srcReq.user) {
            proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
            proxyReqOpts.headers["x-user-role"] = srcReq.user.role;
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Drone service (missions): ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

// Proxy for static images (uploads)
app.use('/uploads', proxy(process.env.PRODUCT_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
        return `/uploads${req.url}`;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Product service (images): ${proxyRes.statusCode}`);
        return proxyResData;
    }
}));

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
    logger.info(`User service running on port ${process.env.USER_SERVICE_URL}`);
    logger.info(`Product service running on port ${process.env.PRODUCT_SERVICE_URL}`);
    logger.info(`Order service running on port ${process.env.ORDER_SERVICE_URL}`);
    logger.info(`Payment service running on port ${process.env.PAYMENT_SERVICE_URL}`);
    logger.info(`Drone service running on port ${process.env.DRONE_SERVICE_URL}`);
    logger.info(`Redis Url ${process.env.REDIS_URL}`);
});