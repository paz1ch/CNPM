const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    // Add metadata if it exists
    if (metadata && Object.keys(metadata).length) {
        msg += ' ' + JSON.stringify(metadata);
    }
    // Add stack trace for errors
    if (stack) {
        msg += `\n${stack}`;
    }
    return msg;
});

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }), // This is key to getting stack traces
        logFormat
    ),
    transports: [
        new transports.Console()
    ],
    exceptionHandlers: [
        new transports.Console()
    ],
    rejectionHandlers: [
        new transports.Console()
    ]
});

module.exports = logger;