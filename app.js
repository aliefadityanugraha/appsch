"use strict";

const express = require("express");
const app = express();

require("dotenv").config();
const path = require("path");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

// Import configurations
const flashConfig = require("./config/flash");
const sessionConfig = require("./config/session");
const logger = require("./config/logger");
const { checkObjectionConnection } = require("./config/database");
const { renderDatabaseError } = require("./controllers/errorController");

// Import middleware
const { 
    requestLogger, 
    securityHeaders, 
    performanceMonitor 
} = require("./middleware/requestLogger");
const { 
    errorHandler, 
    notFoundHandler, 
    handleUnhandledRejection, 
    handleUncaughtException 
} = require("./middleware/errorHandler");
const { csrfProtection } = require("./middleware/csrfMiddleware");

// Setup process error handlers
handleUnhandledRejection();
handleUncaughtException();

const webRoute = require("./routes/web");
const apiRoute = require("./routes/api");

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security and logging middleware
app.use(requestLogger);
app.use(securityHeaders);
app.use(performanceMonitor);

// Basic middleware
app.use(cookieParser());
app.use(sessionConfig.session);
app.use(flash());
app.use(flashConfig.flash);

app.set("view engine", "ejs");
app.set('view cache', false); // Disable view caching for development
app.use(expressLayouts);
app.set('layout', 'layouts/main-layouts');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(methodOverride("_method"));

// CSRF Protection (after body parsing)
app.use(csrfProtection);
app.use("/public", express.static(path.join(__dirname, "public")));

// Database connection check middleware
app.use(async (req, res, next) => {
    // Skip database check for static files
    if (req.path.startsWith('/public/')) {
        return next();
    }
    
    try {
        const dbCheck = await checkObjectionConnection();
        if (!dbCheck.success) {
            return renderDatabaseError(req, res, dbCheck.error);
        }
        next();
    } catch (error) {
        return renderDatabaseError(req, res, error.message);
    }
});

// Routes
app.use("/api", apiRoute);
app.use("/", webRoute);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Log application startup
logger.info('Application initialized', {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    timestamp: new Date().toISOString()
});

module.exports = app;
