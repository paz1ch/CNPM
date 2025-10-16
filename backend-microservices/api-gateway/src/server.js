require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');
const helmet = require('helmet');
const {rateLimit} = require('express-rate-limit');
const {RedisStore} =  require('rate-limit-redis');
const logger = require('./utils/logger');
const proxy = require('express-http-proxy');
const errorHandler = require('./middleware/errorHandler');


const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());

//rate limiting
const ratelimitOptions = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req,res)=>{
        logger.warn(`sensitive endpoint rate limit exceeded for ip: ${req.ip}`);
        res.status(429).json({success: false, message: "Too many requests"});
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    }),
});

app.use(ratelimitOptions);

app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
});

const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api");
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error: ${err.message}`);
        res.status(500).json({
            message: `Internal server error:`, error : err.message
        })
    }
}   


//setting proxy for user service

app.use('/v1/auth', proxy( process.env.USER_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator : (proxyReqOpts, srcReq)=>{
        proxyReqOpts.headers["Content-type"] = "application/json";
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes)=>{
        logger.info(`Response received from user service: ${proxyRes.statusCode}`);

        return proxyResData;
    }
}));

app.use(errorHandler);

app.listen(PORT, ()=>{
    logger.info(`APT Gateway running on port ${PORT}`);
    logger.info(`User service running on port ${process.env.USER_SERVICE_URL}`);
    logger.info(`Redis Url ${process.env.REDIS_URL}`);
})