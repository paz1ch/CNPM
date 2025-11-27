const Mission = require('../models/Mission');
const Drone = require('../models/Drone');
const logger = require('../utils/logger');
const missionManager = require('../managers/missionManager');
const { moveAlongPath } = require('../utils/gis');
const { broadcastDroneUpdate } = require('../websocket/websocket');

// --- Simulation Configuration ---
const SIMULATION_TICK_RATE_MS = 2000; // 2 seconds per tick
const DRONE_SPEED_KPS = 0.05; // 50 meters per second (180 km/h)
const BATTERY_DRAIN_PER_TICK = 0.2; // Percentage points

// In-memory store for active simulations to prevent multiple simulations for the same mission
const activeSimulations = new Map();

/**
 * @desc    Start a simulation for a specific mission.
 * @route   POST /api/v1/simulation/start/:missionId
 * @access  Admin/System
 */
exports.startMissionSimulation = async (req, res) => {
    const { missionId } = req.params;

    if (activeSimulations.has(missionId)) {
        logger.warn(`Simulation for mission ${missionId} is already running.`);
        return res.status(409).json({ success: false, message: 'Simulation already in progress for this mission.' });
    }

    try {
        const mission = await Mission.findById(missionId).populate('drone');
        if (!mission) {
            return res.status(404).json({ success: false, message: 'Mission not found.' });
        }
        if (!mission.drone) {
             return res.status(404).json({ success: false, message: 'No drone assigned to this mission.' });
        }
        if (mission.status !== 'IN_PROGRESS') {
            return res.status(400).json({ success: false, message: `Mission cannot be simulated. Its status is '${mission.status}'.` });
        }

        logger.info(`Starting simulation for Mission ID: ${missionId}`);
        
        // Start the simulation logic asynchronously
        simulateFlight(mission.toObject()); // Use a plain object to avoid mongoose issues in setInterval

        res.json({ success: true, message: 'Mission simulation started.' });
    } catch (error) {
        logger.error(`Failed to start simulation for mission ${missionId}: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error while starting simulation.' });
    }
};

/**
 * Main simulation loop for a drone's flight.
 * @param {object} missionObject - A plain object copy of the mission document.
 */
function simulateFlight(missionObject) {
    const simulationId = missionObject._id.toString();
    
    // --- Phase 1: Delivery Flight ---
    let flightPhase = 'delivery'; // 'delivery' or 'return'
    let currentPath = missionObject.path; // Delivery path
    let destination = missionObject.deliveryLocation;
    let homeBase = missionObject.pickupLocation; // Assume pickup location is the home base

    const simulationInterval = setInterval(async () => {
        const drone = await Drone.findById(missionObject.drone._id);
        if (!drone || activeSimulations.get(simulationId) === 'stopped') {
            clearInterval(simulationInterval);
            activeSimulations.delete(simulationId);
            logger.info(`Simulation ${simulationId} stopped.`);
            return;
        }

        // Calculate distance to move this tick
        const distanceThisTick = DRONE_SPEED_KPS * (SIMULATION_TICK_RATE_MS / 1000);

        // Move the drone along the path
        const { newLocation, reachedDestination } = moveAlongPath(currentPath, drone.currentLocation, distanceThisTick);
        
        // Update drone state in DB
        drone.currentLocation = newLocation;
        drone.batteryLevel = Math.max(0, drone.batteryLevel - BATTERY_DRAIN_PER_TICK);
        await drone.save();
        
        // Broadcast update via WebSocket
        broadcastDroneUpdate({
            droneId: drone._id,
            location: drone.currentLocation,
            battery: drone.batteryLevel,
            status: drone.status,
            missionId: simulationId
        });

        if (drone.batteryLevel <= 0) {
            logger.error(`Drone ${drone._id} ran out of battery during mission ${simulationId}!`);
            await missionManager.updateMissionLifecycle(simulationId, 'FAILED', { failureReason: 'Ran out of battery' });
            clearInterval(simulationInterval);
            activeSimulations.delete(simulationId);
            return;
        }

        // --- Check for phase completion ---
        if (reachedDestination) {
            if (flightPhase === 'delivery') {
                logger.info(`Drone reached delivery destination for mission ${simulationId}.`);
                await missionManager.updateMissionLifecycle(simulationId, 'DELIVERED');
                
                // --- Phase 2: Return Flight ---
                flightPhase = 'return';
                currentPath = [missionObject.deliveryLocation, homeBase]; // Simplified return path
                destination = homeBase;
                logger.info(`Drone ${drone._id} starting return flight to base.`);

            } else if (flightPhase === 'return') {
                logger.info(`Drone has returned to base from mission ${simulationId}.`);
                await missionManager.updateMissionLifecycle(simulationId, 'RETURNED');
                
                // End of simulation
                clearInterval(simulationInterval);
                activeSimulations.delete(simulationId);
            }
        }
    }, SIMULATION_TICK_RATE_MS);

    activeSimulations.set(simulationId, 'running');
}

/**
 * @desc    Stop a running simulation.
 * @route   POST /api/v1/simulation/stop/:missionId
 * @access  Admin/System
 */
exports.stopMissionSimulation = (req, res) => {
    const { missionId } = req.params;
    if (activeSimulations.has(missionId)) {
        activeSimulations.set(missionId, 'stopped');
        logger.info(`Stopping simulation for mission ${missionId}.`);
        res.json({ success: true, message: 'Simulation stop signal sent.' });
    } else {
        res.status(404).json({ success: false, message: 'No active simulation found for this mission.' });
    }
};