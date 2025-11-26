const amqp = require('amqplib');
const logger = require('./logger');

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'order-exchange';

async function connectToRabbitMQ() {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, "direct", { durable: false });

        // Assert queues for order events
        await channel.assertQueue('ORDER_READY', { durable: true });
        await channel.assertQueue('ORDER_DELIVERED', { durable: true });

        logger.info("Connected to RabbitMQ");

        // Listen for ORDER_DELIVERED events from drone service
        channel.consume('ORDER_DELIVERED', async (message) => {
            if (!message) return;

            try {
                const deliveryData = JSON.parse(message.content.toString());
                logger.info('Received ORDER_DELIVERED event', deliveryData);

                // Here you could update the order status in the database
                // For now, just acknowledge the message
                channel.ack(message);
            } catch (error) {
                logger.error('Error processing ORDER_DELIVERED event', { error: error.message });
                channel.nack(message, false, false);
            }
        });

        return channel;
    } catch (e) {
        logger.error('Error connecting to rabbitmq', e);
        throw e;
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