require('dotenv').config()
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const {RateLimiterRedis} = require('rate-limiter-flexible');
const Redis = require('ioredis');
const {rateLimit} = require('express-rate-limit');
const {RedisStore} = require('rate-limit-redis');
const { connectToRabbitMQ } = require('./utils/rabbitmq');
const errorHandler = require('./middleware/errorHandler');

const app = express()
const PORT = process.env.PORT || 3001

const  redisClient = new Redis(process.env.REDIS_URL);

//middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
})

//chong ddos
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1
});

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip).then(()=> next()).catch(()=>{
        res.status(429).json({success: false, message: "Too many requests"});
    });
});

const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: true,
    handler: (req,res)=>{
        logger.warn(`sensitive endpoint rate limit exceeded for ip: ${req.ip}`);
        res.status(429).json({success: false, message: "Too many requests"});
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    }),
})


app.use('api/auth/register', sensitiveEndpointsLimiter);

//route
app.use('/api/auth', routes);

//error handler
app.use(errorHandler);

//ket noi db
mongoose.connect(process.env.MONGO_URI)
    .then(()=> {
        logger.info('Ket noi db thanh cong');
        
        async function startServer() {
            try {
                await connectToRabbitMQ();
                app.listen(PORT, () => {
                    logger.info(`user service running on port ${PORT}`);
                });
            } catch (error) {
                logger.error('Failed to start server', error);
                process.exit(1);
            }
        }

        startServer();
    })
    .catch(e=> {
        logger.error("Ket noi db that bai", e)
        process.exit(1);
    })

process.on('unhandledRejection', (reason, promise)=>{
    logger.error('Unhandled Rejection at', promise, "reason: ", reason)
})