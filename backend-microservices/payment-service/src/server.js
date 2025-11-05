

require('dotenv').config()
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const routes = require('./routes/payment-routes');
const errorHandler = require('./middleware/errorHandler');

const app = express()
const PORT = process.env.PORT || 3004

//ket noi db
mongoose.connect(process.env.MONGO_URI).then(()=> 
logger.info('Ket noi db thanh cong')).catch(e=>
logger.error("Ket noi db that bai", e))

//middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    next();
})

//route
app.use('/api/payment', routes);

//error handler
app.use(errorHandler);

app.listen(PORT, ()=>{
    logger.info(`payment service running on port ${PORT}`);
})

process.on('unhandledRejection', (reason, promise)=>{
    logger.error('Unhandled Rejection at', promise, "reason: ", reason)
})

