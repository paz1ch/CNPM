const amqp = require('amqplib');
const Drone = require('../models/Drone');
const logger = require('../utils/logger');

let channel;
let connection;

const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
        channel = await connection.createChannel();

        // Assert queues for both consuming and publishing
        await channel.assertQueue('ORDER_READY', { durable: true });
        await channel.assertQueue('ORDER_DELIVERED', { durable: true });

        logger.info('Connected to RabbitMQ - Listening for ORDER_READY events');

        channel.consume('ORDER_READY', async (data) => {
            if (!data) return;

            try {
                const order = JSON.parse(data.content.toString());
                logger.info('Received ORDER_READY event', { orderId: order.orderId });

                // Find an IDLE drone with sufficient battery
                const drone = await Drone.findOne({
                    status: 'IDLE',
                    battery: { $gte: 20 }
                }).sort({ battery: -1 }); // Prioritize drones with higher battery

                if (drone) {
                    logger.info(`Assigning drone ${drone.name} to order ${order.orderId}`, {
                        droneId: drone._id,
                        battery: drone.battery,
                        location: drone.location
                    });

                    drone.status = 'BUSY';
                    drone.currentOrderId = order.orderId;
                    await drone.save();

                    // Simulate delivery process
                    simulateDelivery(drone, order);

                    channel.ack(data);
                } else {
                    logger.warn('No available drones for order', { orderId: order.orderId });
                    // Requeue the message after a delay
                    setTimeout(() => {
                        channel.nack(data, false, true);
                    }, 5000);
                }
            } catch (error) {
                logger.error('Error processing ORDER_READY event', { error: error.message, stack: error.stack });
                channel.nack(data, false, false); // Don't requeue on processing errors
            }
        });

        // Handle connection errors
        connection.on('error', (err) => {
            logger.error('RabbitMQ connection error', { error: err.message });
        });

        connection.on('close', () => {
            logger.warn('RabbitMQ connection closed. Reconnecting...');
            setTimeout(connectRabbitMQ, 5000);
        });

    } catch (error) {
        logger.error('RabbitMQ Connection Error', { error: error.message });
        setTimeout(connectRabbitMQ, 5000);
    }
};

const publishOrderDelivered = async (orderId, droneId) => {
    try {
        if (!channel) {
            logger.error('Cannot publish ORDER_DELIVERED: channel not available');
            return;
        }

        const message = {
            orderId,
            droneId,
            deliveredAt: new Date().toISOString(),
            status: 'DELIVERED'
        };

        channel.sendToQueue(
            'ORDER_DELIVERED',
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );

        logger.info('Published ORDER_DELIVERED event', { orderId, droneId });
    } catch (error) {
        logger.error('Error publishing ORDER_DELIVERED event', { error: error.message, orderId });
    }
};

const simulateDelivery = async (drone, order) => {
    const restaurantLocation = order.restaurantLocation || { lat: 10.762622, lng: 106.660172 };
    const customerLocation = order.customerLocation || { lat: 10.782622, lng: 106.680172 };

    let currentLat = restaurantLocation.lat;
    let currentLng = restaurantLocation.lng;

    // Calculate step increments for realistic movement
    const totalSteps = 15; // Delivery in 15 steps (30 seconds at 2s interval)
    const latStep = (customerLocation.lat - restaurantLocation.lat) / totalSteps;
    const lngStep = (customerLocation.lng - restaurantLocation.lng) / totalSteps;
    const batteryDrain = 1;

    let stepCount = 0;

    logger.info('Starting delivery simulation', {
        orderId: order.orderId,
        droneId: drone._id,
        from: restaurantLocation,
        to: customerLocation,
        totalSteps
    });

    // Simulate movement updates
    const interval = setInterval(async () => {
        try {
            const currentDrone = await Drone.findById(drone._id);
            if (!currentDrone) {
                logger.warn('Drone not found, stopping simulation', { droneId: drone._id });
                return clearInterval(interval);
            }

            stepCount++;

            // Move drone towards customer
            currentLat += latStep;
            currentLng += lngStep;
            currentDrone.location.lat = currentLat;
            currentDrone.location.lng = currentLng;
            currentDrone.battery = Math.max(0, currentDrone.battery - batteryDrain);

            await currentDrone.save();

            logger.debug('Drone position updated', {
                orderId: order.orderId,
                droneId: drone._id,
                step: stepCount,
                location: currentDrone.location,
                battery: currentDrone.battery
            });

            // Check if delivery is complete
            if (stepCount >= totalSteps || currentDrone.battery <= 0) {
                clearInterval(interval);

                currentDrone.status = 'IDLE';
                currentDrone.currentOrderId = null;
                await currentDrone.save();

                logger.info(`Delivery completed for order ${order.orderId}`, {
                    droneId: drone._id,
                    finalLocation: currentDrone.location,
                    remainingBattery: currentDrone.battery
                });

                // Publish ORDER_DELIVERED event
                await publishOrderDelivered(order.orderId, drone._id.toString());
            }
        } catch (error) {
            logger.error('Error during delivery simulation', {
                error: error.message,
                orderId: order.orderId,
                droneId: drone._id
            });
            clearInterval(interval);
        }
    }, 2000);
};

module.exports = connectRabbitMQ;
