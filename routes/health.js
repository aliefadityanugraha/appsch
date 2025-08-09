"use strict";

const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const {
    checkDatabaseHealth,
    checkApplicationHealth,
    getSystemInfo,
    getConnectionPoolStatus,
    performanceMetrics
} = require('../utils/healthCheck');

/**
 * Basic Health Check
 * GET /health
 */
router.get('/', asyncHandler(async (req, res) => {
    const health = await checkApplicationHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health
    });
}));

/**
 * Database Health Check
 * GET /health/database
 */
router.get('/database', asyncHandler(async (req, res) => {
    const dbHealth = await checkDatabaseHealth();
    
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
        success: dbHealth.status === 'healthy',
        data: dbHealth
    });
}));

/**
 * System Information
 * GET /health/system
 */
router.get('/system', asyncHandler(async (req, res) => {
    const systemInfo = getSystemInfo();
    
    res.json({
        success: true,
        data: systemInfo
    });
}));

/**
 * Connection Pool Status
 * GET /health/pool
 */
router.get('/pool', asyncHandler(async (req, res) => {
    const poolStatus = await getConnectionPoolStatus();
    
    res.json({
        success: true,
        data: poolStatus
    });
}));

/**
 * Performance Metrics
 * GET /health/metrics
 */
router.get('/metrics', asyncHandler(async (req, res) => {
    const metrics = performanceMetrics.getMetrics();
    
    res.json({
        success: true,
        data: metrics
    });
}));

/**
 * Reset Performance Metrics
 * POST /health/metrics/reset
 */
router.post('/metrics/reset', asyncHandler(async (req, res) => {
    performanceMetrics.reset();
    
    logger.info('Performance metrics reset', {
        requestId: req.requestId,
        userId: req.user?.id || 'anonymous',
        ip: req.ip
    });
    
    res.json({
        success: true,
        message: 'Performance metrics reset successfully'
    });
}));

/**
 * Detailed Health Report
 * GET /health/detailed
 */
router.get('/detailed', asyncHandler(async (req, res) => {
    try {
        const [appHealth, systemInfo, poolStatus, metrics] = await Promise.all([
            checkApplicationHealth(),
            Promise.resolve(getSystemInfo()),
            getConnectionPoolStatus(),
            Promise.resolve(performanceMetrics.getMetrics())
        ]);
        
        const detailedReport = {
            application: appHealth,
            system: systemInfo,
            connectionPool: poolStatus,
            performance: metrics,
            timestamp: new Date().toISOString()
        };
        
        const statusCode = appHealth.status === 'healthy' ? 200 : 503;
        
        res.status(statusCode).json({
            success: appHealth.status === 'healthy',
            data: detailedReport
        });
        
    } catch (error) {
        logger.error('Failed to generate detailed health report', {
            error: error.message,
            requestId: req.requestId
        });
        
        res.status(503).json({
            success: false,
            error: {
                message: 'Failed to generate health report',
                code: 'HEALTH_CHECK_FAILED'
            }
        });
    }
}));

/**
 * Liveness Probe (for Kubernetes/Docker)
 * GET /health/live
 */
router.get('/live', (req, res) => {
    // Simple liveness check - just return 200 if the process is running
    res.status(200).json({
        success: true,
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

/**
 * Readiness Probe (for Kubernetes/Docker)
 * GET /health/ready
 */
router.get('/ready', asyncHandler(async (req, res) => {
    try {
        // Check if application is ready to serve traffic
        await checkDatabaseHealth();
        
        res.status(200).json({
            success: true,
            status: 'ready',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'not_ready',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}));

/**
 * Error Report Endpoint (for client-side error reporting)
 * POST /health/error-report
 */
router.post('/error-report', asyncHandler(async (req, res) => {
    const { type, statusCode, url, userAgent, timestamp, details } = req.body;
    
    const errorReport = {
        type: type || 'client_error',
        statusCode,
        url,
        userAgent,
        timestamp: timestamp || new Date().toISOString(),
        details,
        requestId: req.requestId,
        ip: req.ip,
        userId: req.user?.id || 'anonymous'
    };
    
    logger.warn('Client error report received', errorReport);
    
    res.json({
        success: true,
        message: 'Error report received'
    });
}));

/**
 * Health Check Dashboard (HTML)
 * GET /health/dashboard
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
    try {
        const [appHealth, systemInfo, poolStatus, metrics] = await Promise.all([
            checkApplicationHealth(),
            Promise.resolve(getSystemInfo()),
            getConnectionPoolStatus(),
            Promise.resolve(performanceMetrics.getMetrics())
        ]);
        
        res.render('health/dashboard', {
            title: 'Health Dashboard',
            appHealth,
            systemInfo,
            poolStatus,
            metrics,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Failed to render health dashboard', {
            error: error.message,
            requestId: req.requestId
        });
        
        res.status(500).render('error/500', {
            title: 'Dashboard Error',
            message: 'Failed to load health dashboard',
            statusCode: 500,
            showDetails: process.env.NODE_ENV !== 'production',
            details: process.env.NODE_ENV !== 'production' ? error.stack : null
        });
    }
}));

module.exports = router;