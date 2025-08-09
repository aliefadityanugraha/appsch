"use strict";

const logger = require('../config/logger');
const { knex } = require('../config/database');
const { DatabaseError } = require('../middleware/errorHandler');

/**
 * Database Health Check
 */
async function checkDatabaseHealth() {
    try {
        const startTime = Date.now();
        
        // Test basic connection
        await knex.raw('SELECT 1 as health_check');
        
        const responseTime = Date.now() - startTime;
        
        // Test table existence
        const tables = await knex.raw('SHOW TABLES');
        const tableCount = tables[0].length;
        
        // Get database info
        const dbInfo = await knex.raw('SELECT VERSION() as version');
        const version = dbInfo[0][0].version;
        
        const healthStatus = {
            status: 'healthy',
            database: {
                connected: true,
                responseTime: `${responseTime}ms`,
                version: version,
                tableCount: tableCount
            },
            timestamp: new Date().toISOString()
        };
        
        logger.info('Database health check passed', healthStatus);
        return healthStatus;
        
    } catch (error) {
        const healthStatus = {
            status: 'unhealthy',
            database: {
                connected: false,
                error: error.message
            },
            timestamp: new Date().toISOString()
        };
        
        logger.error('Database health check failed', healthStatus);
        throw new DatabaseError('Database health check failed', error);
    }
}

/**
 * Application Health Check
 */
async function checkApplicationHealth() {
    try {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const uptime = process.uptime();
        
        // Check database
        const dbHealth = await checkDatabaseHealth();
        
        const healthStatus = {
            status: 'healthy',
            application: {
                uptime: `${Math.floor(uptime)}s`,
                memory: {
                    used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                    external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                },
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || 'development'
            },
            database: dbHealth.database,
            timestamp: new Date().toISOString()
        };
        
        // Check for warnings
        const warnings = [];
        
        if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
            warnings.push('High memory usage detected');
        }
        
        if (uptime < 60) { // Less than 1 minute
            warnings.push('Application recently restarted');
        }
        
        if (warnings.length > 0) {
            healthStatus.warnings = warnings;
            logger.warn('Health check warnings', { warnings });
        }
        
        return healthStatus;
        
    } catch (error) {
        logger.error('Application health check failed', { error: error.message });
        throw error;
    }
}

/**
 * Detailed System Information
 */
function getSystemInfo() {
    const os = require('os');
    
    return {
        system: {
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            cpus: os.cpus().length,
            totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
            freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
            loadAverage: os.loadavg(),
            uptime: `${Math.floor(os.uptime())}s`
        },
        process: {
            pid: process.pid,
            version: process.version,
            platform: process.platform,
            arch: process.arch,
            uptime: `${Math.floor(process.uptime())}s`,
            cwd: process.cwd(),
            execPath: process.execPath
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * Database Connection Pool Status
 */
async function getConnectionPoolStatus() {
    try {
        const pool = knex.client.pool;
        
        return {
            pool: {
                min: pool.min,
                max: pool.max,
                used: pool.numUsed(),
                free: pool.numFree(),
                pending: pool.numPendingAcquires(),
                pendingCreates: pool.numPendingCreates()
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        logger.error('Failed to get connection pool status', { error: error.message });
        return {
            pool: {
                error: 'Unable to retrieve pool status'
            },
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Performance Metrics
 */
class PerformanceMetrics {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                averageResponseTime: 0
            },
            database: {
                queries: 0,
                averageQueryTime: 0,
                errors: 0
            },
            memory: {
                peak: 0,
                current: 0
            }
        };
        
        this.responseTimes = [];
        this.queryTimes = [];
        
        // Start monitoring
        this.startMonitoring();
    }
    
    recordRequest(responseTime, success = true) {
        this.metrics.requests.total++;
        
        if (success) {
            this.metrics.requests.success++;
        } else {
            this.metrics.requests.errors++;
        }
        
        this.responseTimes.push(responseTime);
        
        // Keep only last 1000 response times
        if (this.responseTimes.length > 1000) {
            this.responseTimes.shift();
        }
        
        this.updateAverageResponseTime();
    }
    
    recordDatabaseQuery(queryTime, success = true) {
        this.metrics.database.queries++;
        
        if (!success) {
            this.metrics.database.errors++;
        }
        
        this.queryTimes.push(queryTime);
        
        // Keep only last 1000 query times
        if (this.queryTimes.length > 1000) {
            this.queryTimes.shift();
        }
        
        this.updateAverageQueryTime();
    }
    
    updateAverageResponseTime() {
        if (this.responseTimes.length > 0) {
            const sum = this.responseTimes.reduce((a, b) => a + b, 0);
            this.metrics.requests.averageResponseTime = Math.round(sum / this.responseTimes.length);
        }
    }
    
    updateAverageQueryTime() {
        if (this.queryTimes.length > 0) {
            const sum = this.queryTimes.reduce((a, b) => a + b, 0);
            this.metrics.database.averageQueryTime = Math.round(sum / this.queryTimes.length);
        }
    }
    
    startMonitoring() {
        // Monitor memory usage every 30 seconds
        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            const currentMemory = memoryUsage.heapUsed;
            
            this.metrics.memory.current = currentMemory;
            
            if (currentMemory > this.metrics.memory.peak) {
                this.metrics.memory.peak = currentMemory;
            }
            
            // Log metrics every 5 minutes
            if (Date.now() % (5 * 60 * 1000) < 30000) {
                logger.info('Performance metrics', this.getMetrics());
            }
        }, 30000);
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            memory: {
                peak: `${Math.round(this.metrics.memory.peak / 1024 / 1024)}MB`,
                current: `${Math.round(this.metrics.memory.current / 1024 / 1024)}MB`
            },
            timestamp: new Date().toISOString()
        };
    }
    
    reset() {
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                averageResponseTime: 0
            },
            database: {
                queries: 0,
                averageQueryTime: 0,
                errors: 0
            },
            memory: {
                peak: 0,
                current: 0
            }
        };
        
        this.responseTimes = [];
        this.queryTimes = [];
    }
}

// Global performance metrics instance
const performanceMetrics = new PerformanceMetrics();

module.exports = {
    checkDatabaseHealth,
    checkApplicationHealth,
    getSystemInfo,
    getConnectionPoolStatus,
    PerformanceMetrics,
    performanceMetrics
};