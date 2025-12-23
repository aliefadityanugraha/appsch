"use strict";

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Logger utility for application-wide logging
 */
class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.enableConsole = process.env.LOG_CONSOLE !== 'false';
        this.enableFile = process.env.LOG_FILE !== 'false';
    }

    /**
     * Get current timestamp in ISO format
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Format log message
     */
    formatMessage(level, message, meta = {}) {
        const timestamp = this.getTimestamp();
        const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    /**
     * Write log to file (Asynchronous for performance)
     */
    writeToFile(level, formattedMessage) {
        if (!this.enableFile) return;

        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(logsDir, `${date}.log`);
        const errorLogFile = path.join(logsDir, `${date}-error.log`);

        // Write to general log asynchronously
        fs.appendFile(logFile, formattedMessage + '\n', (err) => {
            if (err) console.error('Failed to write to general log:', err);
        });

        // Write errors to separate error log asynchronously
        if (level === 'error' || level === 'fatal') {
            fs.appendFile(errorLogFile, formattedMessage + '\n', (err) => {
                if (err) console.error('Failed to write to error log:', err);
            });
        }
    }

    /**
     * Log message with specified level
     */
    log(level, message, meta = {}) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };
        const currentLevel = levels[this.logLevel] || 1;
        const messageLevel = levels[level] || 1;

        if (messageLevel < currentLevel) return;

        const formattedMessage = this.formatMessage(level, message, meta);

        // Console output
        if (this.enableConsole) {
            switch (level) {
                case 'debug':
                    console.debug(formattedMessage);
                    break;
                case 'info':
                    console.info(formattedMessage);
                    break;
                case 'warn':
                    console.warn(formattedMessage);
                    break;
                case 'error':
                case 'fatal':
                    console.error(formattedMessage);
                    break;
                default:
                    console.log(formattedMessage);
            }
        }

        // File output
        this.writeToFile(level, formattedMessage);
    }

    /**
     * Debug level logging
     */
    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    /**
     * Info level logging
     */
    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    /**
     * Warning level logging
     */
    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    /**
     * Error level logging
     */
    error(message, meta = {}) {
        // If message is an Error object, extract useful information
        if (message instanceof Error) {
            meta = {
                ...meta,
                name: message.name,
                stack: message.stack,
                code: message.code
            };
            message = message.message;
        }
        this.log('error', message, meta);
    }

    /**
     * Fatal level logging
     */
    fatal(message, meta = {}) {
        if (message instanceof Error) {
            meta = {
                ...meta,
                name: message.name,
                stack: message.stack,
                code: message.code
            };
            message = message.message;
        }
        this.log('fatal', message, meta);
    }

    /**
     * Log HTTP request
     */
    logRequest(req, res, responseTime) {
        const meta = {
            method: req.method,
            url: req.originalUrl || req.url,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userId: req.user?.id || 'anonymous'
        };

        const level = res.statusCode >= 400 ? 'warn' : 'info';
        this.log(level, `HTTP ${req.method} ${req.originalUrl || req.url}`, meta);
    }

    /**
     * Log database operation
     */
    logDatabase(operation, table, meta = {}) {
        this.debug(`Database ${operation} on ${table}`, meta);
    }

    /**
     * Log authentication events
     */
    logAuth(event, userId, meta = {}) {
        this.info(`Auth: ${event}`, { userId, ...meta });
    }

    /**
     * Log security events
     */
    logSecurity(event, meta = {}) {
        this.warn(`Security: ${event}`, meta);
    }
}

// Create singleton instance
const logger = new Logger();

// Export class and instance for backward compatibility
module.exports = logger;
module.exports.Logger = Logger;