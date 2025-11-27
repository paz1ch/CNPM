const amqp = require('amqplib');
const logger = require('../utils/logger');

// Prefer the environment variable used in docker-compose (`RABBITMQ_URL`).
const AMQP_URL = process.env.RABBITMQ_URL || process.env.AMQP_URL || 'amqp://rabbitmq:5672';

let channel = null;

async function connectPublisher() {
    try {
        const connection = await amqp.connect(AMQP_URL);
        channel = await connection.createChannel();
        logger.info('RabbitMQ Publisher Connected');
    } catch (error) {
        logger.error('Failed to connect RabbitMQ Publisher', { error: error.message });
        // Retry logic could be added here
    }
}

async function publishToQueue(queueName, message) {
    try {
        if (!channel) {
            await connectPublisher();
        }

        if (!channel) {
            throw new Error('Channel not available');
        }

        await channel.assertQueue(queueName, { durable: true });

        const success = channel.sendToQueue(
            queueName,
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );

        if (success) {
            logger.info(`Published to ${queueName}:`, message);
        } else {
            logger.warn(`Failed to publish to ${queueName}`);
        }
        return success;

    } catch (error) {
        logger.error(`Error publishing to ${queueName}:`, error);
        return false;
    }
}

module.exports = { connectPublisher, publishToQueue };
