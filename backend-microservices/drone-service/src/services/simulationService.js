const Drone = require('../models/Drone');
const Mission = require('../models/Mission');
const logger = require('../utils/logger');

// Store active intervals
const activeSimulations = {};

/**
 * Calculate next position based on current, target, and speed
 * Simple linear interpolation for now
 */
const moveTowards = (current, target, speed = 0.001) => {
    const dx = target.lat - current.lat;
    const dy = target.lng - current.lng;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= speed) {
        return target; // Arrived
    }

    const ratio = speed / distance;
    return {
        lat: current.lat + dx * ratio,
        lng: current.lng + dy * ratio
    };
};

exports.startSimulation = (droneId, missionId) => {
    if (activeSimulations[droneId]) {
        logger.warn(`Simulation already running for drone ${droneId}`);
        return;
    }

    logger.info(`Starting simulation for drone ${droneId}, mission ${missionId}`);

    activeSimulations[droneId] = setInterval(async () => {
        try {
            const drone = await Drone.findById(droneId);
            const mission = await Mission.findById(missionId);

            if (!drone || !mission || mission.status !== 'ASSIGNED' && mission.status !== 'IN_PROGRESS') {
                exports.stopSimulation(droneId);
                return;
            }

            // Update mission status to IN_PROGRESS if just started
            if (mission.status === 'ASSIGNED') {
                mission.status = 'IN_PROGRESS';
                await mission.save();
            }

            const current = drone.currentLocation;
            const target = mission.deliveryLocation;

            // Move drone
            const newLocation = moveTowards(current, target);
            drone.currentLocation = newLocation;

            // Decrease battery slightly
            drone.batteryLevel = Math.max(0, drone.batteryLevel - 0.1);

            // Check if arrived
            if (newLocation.lat === target.lat && newLocation.lng === target.lng) {
                logger.info(`Drone ${droneId} arrived at destination`);
                mission.status = 'ARRIVED'; // Custom status for "Waiting for user confirmation"
                // Or we can keep it as IN_PROGRESS but the location matches
                // Let's use a flag or just check location

                // For this requirement, let's say we stop simulation when arrived
                exports.stopSimulation(droneId);
            }

            await drone.save();
            await mission.save();

        } catch (error) {
            logger.error(`Simulation error for drone ${droneId}:`, error);
            exports.stopSimulation(droneId);
        }
    }, 2000); // Update every 2 seconds
};

exports.stopSimulation = (droneId) => {
    if (activeSimulations[droneId]) {
        clearInterval(activeSimulations[droneId]);
        delete activeSimulations[droneId];
        logger.info(`Stopped simulation for drone ${droneId}`);
    }
};
