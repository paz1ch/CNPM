const Drone = require('../models/Drone');
const Mission = require('../models/Mission');
const logger = require('../utils/logger');
const { calculatePath, calculateDistance } = require('../utils/gis'); 

class MissionManager {
    /**
     * Assigns a new mission to an available drone.
     * @param {object} missionData - Data for the new mission.
     * @param {string} missionData.orderId - The ID of the associated order.
     * @param {object} missionData.pickupLocation - The pickup coordinates {lat, lng}.
     * @param {object} missionData.deliveryLocation - The delivery coordinates {lat, lng}.
     * @returns {Promise<object>} - Result object with success status and data.
     */
    async assignMission(missionData) {
        const { orderId, pickupLocation, deliveryLocation } = missionData;

        // 1. Find an available drone
        const availableDrone = await this.findAvailableDrone();
        if (!availableDrone) {
            return { success: false, message: 'No available drones found.' };
        }
        
        logger.info(`Found available drone: ${availableDrone.name} (${availableDrone._id}) for Order ${orderId}`);

        try {
            // 2. Calculate path and estimated time
            const path = calculatePath(pickupLocation, deliveryLocation);
            const distance = calculateDistance(pickupLocation, deliveryLocation); // in km
            const estimatedTravelTime = (distance / availableDrone.maxSpeed) * 60; // in minutes

            // 3. Create and save the new mission
            const newMission = await Mission.create({
                orderId,
                drone: availableDrone._id,
                pickupLocation,
                deliveryLocation,
                path,
                estimatedTravelTime,
                status: 'IN_PROGRESS' 
            });
            
            // 4. Update the drone's status and assign the mission
            availableDrone.mission = newMission._id;
            availableDrone.status = 'DELIVERING';
            await availableDrone.save();

            logger.info(`Mission ${newMission._id} created and assigned to Drone ${availableDrone._id}. Status set to DELIVERING.`);

            // Populate drone details for the response
            await newMission.populate('drone');

            return { success: true, message: 'Mission assigned successfully.', data: newMission };

        } catch (error) {
            logger.error(`Failed to assign mission for order ${orderId}: ${error.message}`);
            // Rollback drone status if it was changed
            if (availableDrone) {
                availableDrone.status = 'IDLE';
                availableDrone.mission = null;
                await availableDrone.save();
            }
            return { success: false, message: 'Error creating mission.', error: error.message };
        }
    }

    /**
     * Finds the best available drone for a mission.
     * Criteria: IDLE status, sufficient battery, maybe closest to pickup (future enhancement).
     * @returns {Promise<Drone|null>}
     */
    async findAvailableDrone() {
        return await Drone.findOneAndUpdate(
            {
                status: 'IDLE',
                batteryLevel: { $gt: 25 } // Must have more than 25% battery
            },
            {
                status: 'RESERVED' // Temporarily reserve it to prevent race conditions
            },
            { new: true, sort: { batteryLevel: -1 } } // Get the one with the most battery
        );
    }
    
    /**
     * Updates the lifecycle of a mission and its associated drone.
     * @param {string} missionId - The ID of the mission to update.
     * @param {string} newStatus - The new status for the mission.
     * @param {object} options - Additional data for the update.
     * @returns {Promise<object>}
     */
    async updateMissionLifecycle(missionId, newStatus, options = {}) {
        const { failureReason, message } = options;
        const mission = await Mission.findById(missionId);

        if (!mission) {
            return { success: false, status: 404, message: 'Mission not found.' };
        }
        
        const drone = await Drone.findById(mission.drone);
        if (!drone) {
            // This case should be rare but is a safeguard.
            mission.status = 'FAILED';
            mission.failureReason = 'Associated drone not found.';
            await mission.save();
            return { success: false, status: 404, message: 'Associated drone not found.' };
        }

        // Update mission history
        const historyEntry = { status: newStatus, message: message || `Status changed to ${newStatus}` };
        mission.history.push(historyEntry);

        // Main state machine logic
        switch (newStatus) {
            case 'DELIVERED':
                mission.status = 'DELIVERED';
                mission.completedAt = new Date();
                drone.status = 'RETURNING';
                logger.info(`Mission ${missionId} completed. Drone ${drone._id} is returning.`);
                break;
            case 'RETURNED':
                 mission.status = 'RETURNED';
                 drone.status = 'IDLE';
                 drone.mission = null; // Free the drone
                 logger.info(`Drone ${drone._id} has returned and is now IDLE.`);
                break;
            case 'FAILED':
                mission.status = 'FAILED';
                mission.failureReason = failureReason || 'Unknown failure';
                drone.status = 'RETURNING'; // Or 'MAINTENANCE' depending on failure type
                logger.error(`Mission ${missionId} failed: ${mission.failureReason}. Drone ${drone._id} is returning.`);
                break;
            default:
                mission.status = newStatus;
        }

        await mission.save();
        await drone.save();
        
        return { success: true, message: `Mission status updated to ${newStatus}.`, data: mission };
    }

    /**
     * Cancels an active or pending mission.
     * @param {string} missionId - The ID of the mission to cancel.
     * @param {string} reason - The reason for cancellation.
     * @returns {Promise<object>}
     */
    async cancelMission(missionId, reason) {
        const mission = await Mission.findById(missionId);

        if (!mission) {
            return { success: false, status: 404, message: 'Mission not found.' };
        }
        
        if (['DELIVERED', 'RETURNED', 'FAILED'].includes(mission.status)) {
            return { success: false, status: 409, message: `Cannot cancel a mission that is already ${mission.status}.` };
        }

        return await this.updateMissionLifecycle(missionId, 'FAILED', {
            failureReason: reason,
            message: `Mission cancelled: ${reason}`
        });
    }
}

module.exports = new MissionManager();