"use strict";

const express = require("express");
const app = express();

require("dotenv").config();
const compression = require("compression");
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

// Basic middleware
app.use(compression());
app.use(requestLogger);
app.use(securityHeaders);
app.use(performanceMonitor);

// Basic middleware
app.use(cookieParser());
app.use(sessionConfig.session);
app.use(flash());
app.use(flashConfig.flash);

app.set("view engine", "ejs");
// Enable view cache in production
app.set('view cache', process.env.NODE_ENV === 'production');
app.use(expressLayouts);
app.set('layout', 'layouts/main-layouts');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(methodOverride("_method"));

// CSRF Protection (after body parsing)
app.use(csrfProtection);

// Static files with caching
app.use("/public", express.static(path.join(__dirname, "public"), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
    etag: true,
    lastModified: true,
    immutable: process.env.NODE_ENV === 'production',
    setHeaders: (res, filePath) => {
        // Cache CSS, JS, images for 1 year in production
        if (filePath.match(/\.(css|js|jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        // HTML files should not be cached
        if (filePath.endsWith('.html') || filePath.endsWith('.ejs')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// Database connection check moved to index.js startup for performance
// Redundant middleware removed

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
