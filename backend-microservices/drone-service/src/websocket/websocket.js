const WebSocket = require('ws');
const logger = require('../utils/logger');

let wss;

exports.initWebSocketServer = (server) => {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        logger.info('New WebSocket connection');

        ws.on('message', (message) => {
            logger.info('Received:', message);
        });

        ws.on('close', () => {
            logger.info('WebSocket connection closed');
        });
    });

    logger.info('WebSocket server initialized');
};

exports.broadcast = (data) => {
    if (!wss) return;
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};
