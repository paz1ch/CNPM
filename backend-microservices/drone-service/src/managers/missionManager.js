const Drone = require('../models/Drone');
const Mission = require('../models/Mission');
const logger = require('../utils/logger');
const { publishToQueue } = require('../rabbitmq/publisher');

exports.assignMission = async (missionData) => {
    try {
        // Find an available drone
        const drone = await Drone.findOne({ status: 'IDLE', batteryLevel: { $gt: 20 } });

        if (!drone) {
            return { success: false, message: 'No drones available' };
        }

        // Create mission
        const mission = await Mission.create({
            orderId: missionData.orderId,
            drone: drone._id,
            status: 'ASSIGNED',
            pickupLocation: missionData.pickupLocation,
            deliveryLocation: missionData.deliveryLocation
        });

        // Update drone status
        drone.status = 'DELIVERING';
        drone.mission = mission._id;
        await drone.save();

        logger.info(`Mission ${mission._id} assigned to drone ${drone.name}`);

        // Publish ORDER_OUT_FOR_DELIVERY event
        await publishToQueue('ORDER_OUT_FOR_DELIVERY', {
            orderId: missionData.orderId,
            droneId: drone._id,
            timestamp: new Date().toISOString()
        });

        return { success: true, mission };

    } catch (error) {
        logger.error('Error assigning mission:', error);
        return { success: false, message: error.message };
    }
};
