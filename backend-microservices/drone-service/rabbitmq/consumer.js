const amqp = require('amqplib');
const logger = require('../utils/logger');
const missionManager = require('../managers/missionManager');

// Prefer the environment variable used in docker-compose (`RABBITMQ_URL`).
// Fallback to `AMQP_URL` or to the docker service name `rabbitmq` so containers
// can resolve the hostname on the compose network.
const AMQP_URL = process.env.RABBITMQ_URL || process.env.AMQP_URL || 'amqp://rabbitmq:5672';
const ORDER_QUEUE = 'order.created'; // The queue this service will listen to

let channel = null;

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(AMQP_URL);
        channel = await connection.createChannel();

        logger.info('Connected to RabbitMQ');

        // Assert the queue exists
        await channel.assertQueue(ORDER_QUEUE, {
            durable: true // Make sure the queue survives broker restarts
        });

        logger.info(`[*] Waiting for messages in ${ORDER_QUEUE}. To exit press CTRL+C`);

        // Start consuming messages
        channel.consume(ORDER_QUEUE, handleMessage, {
            noAck: false // We will manually acknowledge messages
        });

    } catch (error) {
        logger.error('Failed to connect or consume from RabbitMQ', { error: error.message, stack: error.stack });
        // Optional: implement a retry mechanism
        setTimeout(connectRabbitMQ, 10000); // Retry after 10 seconds
    }
}

async function handleMessage(msg) {
    if (msg.content) {
        const orderData = JSON.parse(msg.content.toString());
        logger.info(`[x] Received order: ${orderData.orderId}`);

        try {
            // --- The core integration point ---
            // The message should contain the necessary data to start a mission
            const missionData = {
                orderId: orderData.orderId,
                pickupLocation: orderData.restaurantLocation, // Assuming this structure
                deliveryLocation: orderData.deliveryAddress.location // Assuming this structure
            };
            
            if (!missionData.pickupLocation || !missionData.deliveryLocation) {
                 throw new Error('Missing location data in order message.');
            }

            const result = await missionManager.assignMission(missionData);
            
            if (result.success) {
                logger.info(`Mission assigned for order ${orderData.orderId}`);
                // Acknowledge the message was processed successfully
                channel.ack(msg);
            } else {
                // This could be a temporary issue (no drones).
                // We'll reject and requeue for another attempt later.
                logger.warn(`Failed to assign mission for order ${orderData.orderId}: ${result.message}. Re-queueing.`);
                // Be careful with re-queueing to avoid infinite loops.
                // A dead-letter queue is a better pattern for persistent failures.
                setTimeout(() => channel.nack(msg, false, true), 5000); // Wait 5s before re-queue
            }
        } catch (error) {
            logger.error(`Error processing order ${orderData.orderId}: ${error.message}`);
            // Do not requeue on processing error to avoid poison pills.
            // Move to a dead-letter queue or just acknowledge and log.
            channel.ack(msg);
        }
    }
}

module.exports = { connectRabbitMQ };