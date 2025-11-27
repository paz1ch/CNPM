const WebSocket = require('ws');
const logger = require('../utils/logger');

let wss;

/**
 * Initializes the WebSocket server.
 * @param {http.Server} server - The HTTP server to attach the WebSocket server to.
 */
function initWebSocketServer(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        logger.info('New WebSocket client connected.');

        ws.on('message', (message) => {
            // You can handle incoming messages from clients if needed
            logger.info('Received WebSocket message:', message);
        });

        ws.on('close', () => {
            logger.info('WebSocket client disconnected.');
        });

        ws.on('error', (error) => {
            logger.error('WebSocket error:', error);
        });
    });

    logger.info('WebSocket server initialized.');
}

/**
 * Broadcasts a message to all connected WebSocket clients.
 * @param {object} data - The data to send. It will be JSON-stringified.
 */
function broadcast(data) {
    if (!wss) {
        logger.warn('WebSocket server not initialized. Cannot broadcast message.');
        return;
    }

    const message = JSON.stringify(data);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message, (error) => {
                if (error) {
                    logger.error('Error sending message to a WebSocket client:', error);
                }
            });
        }
    });
}

/**
 * Specifically broadcasts drone location and status updates.
 * @param {object} update - The drone update object.
 * @param {string} update.droneId - The ID of the drone.
 * @param {object} update.location - The new coordinates {lat, lng}.
 * @param {number} update.battery - The current battery level.
 * @param {string} update.status - The current status of the drone.
 * @param {string} update.missionId - The ID of the current mission.
 */
function broadcastDroneUpdate(update) {
    broadcast({
        type: 'DRONE_UPDATE',
        payload: update
    });
}

module.exports = {
    initWebSocketServer,
    broadcast,
    broadcastDroneUpdate
};