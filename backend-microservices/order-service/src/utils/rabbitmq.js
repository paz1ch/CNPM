const amqp = require('amqplib');
const logger = require('./logger');

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'order-exchange';

async function connectToRabbitMQ() {
    const retries = 10;
    const interval = 5000; // 5 seconds

    for (let i = 0; i < retries; i++) {
        try {
            logger.info(`Attempting to connect to RabbitMQ (Attempt ${i + 1}/${retries})...`);
            connection = await amqp.connect(process.env.RABBITMQ_URL);
            channel = await connection.createChannel();

            await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: false });

            // Assert queues for order events
            await channel.assertQueue('ORDER_READY', { durable: true });
            await channel.assertQueue('ORDER_DELIVERED', { durable: true });
            await channel.assertQueue('ORDER_OUT_FOR_DELIVERY', { durable: true });

            logger.info("Connected to RabbitMQ");

            // Listen for ORDER_DELIVERED events from drone service
            channel.consume('ORDER_DELIVERED', async (message) => {
                if (!message) return;

                try {
                    const deliveryData = JSON.parse(message.content.toString());
                    logger.info('Received ORDER_DELIVERED event', deliveryData);

                    // Update the order status in the database
                    const Order = require('../models/order');
                    const order = await Order.findOne({ orderID: deliveryData.orderId });

                    if (order) {
                        order.status = 'Delivered';
                        await order.save();
                        logger.info(`Order ${deliveryData.orderId} marked as Delivered`);
                    } else {
                        logger.warn(`Order ${deliveryData.orderId} not found for delivery update`);
                    }

                    channel.ack(message);
                } catch (error) {
                    logger.error('Error processing ORDER_DELIVERED event', { error: error.message });
                    channel.nack(message, false, false);
                }
            });

            // Listen for ORDER_OUT_FOR_DELIVERY events from drone service
            channel.consume('ORDER_OUT_FOR_DELIVERY', async (message) => {
                if (!message) return;

                try {
                    const deliveryData = JSON.parse(message.content.toString());
                    logger.info('Received ORDER_OUT_FOR_DELIVERY event', deliveryData);

                    const Order = require('../models/order');
                    const order = await Order.findOne({ orderID: deliveryData.orderId });

                    if (order) {
                        order.status = 'Out for Delivery';
                        await order.save();
                        logger.info(`Order ${deliveryData.orderId} marked as Out for Delivery`);
                    } else {
                        logger.warn(`Order ${deliveryData.orderId} not found for status update`);
                    }

                    channel.ack(message);
                } catch (error) {
                    logger.error('Error processing ORDER_OUT_FOR_DELIVERY event', { error: error.message });
                    channel.nack(message, false, false);
                }
            });

            return channel;
        } catch (e) {
            logger.error(`Error connecting to rabbitmq (Attempt ${i + 1}/${retries}):`, e.message);
            if (i === retries - 1) {
                logger.error('Max retries reached. Exiting...');
                throw e;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }
}

async function publishToQueue(queueName, message) {
    try {
        if (!channel) {
            logger.error('Cannot publish message: RabbitMQ channel not available');
            return false;
        }

        await channel.assertQueue(queueName, { durable: true });

        const success = channel.sendToQueue(
            queueName,
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );

        if (success) {
            logger.info(`Published message to queue: ${queueName}`, { message });
        } else {
            logger.warn(`Failed to publish message to queue: ${queueName}`);
        }

        return success;
    } catch (error) {
        logger.error('Error publishing to queue', { error: error.message, queueName });
        return false;
    }
}

module.exports = { connectToRabbitMQ, publishToQueue };