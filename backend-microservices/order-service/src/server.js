const express = require('express');
const bodyParser = require('body-parser');
const orderRoutes = require('./routes/order-routes');
const logger = require('./utils/logger');
const { default: mongoose } = require('mongoose');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use('/orders', orderRoutes);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        logger.info('Connected to MongoDB');
    })
    .catch((error) => {
        logger.error('Error connecting to MongoDB: %o', error);
    });
const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    logger.info(`Order Service running on port ${PORT}`);
});