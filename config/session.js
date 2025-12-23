"use strict";

require('dotenv').config();
const session = require("express-session");
const { ConnectSessionKnexStore } = require('connect-session-knex');

/**
 * Session Configuration Class
 * Handles session management with database store
 */
class SessionConfig {
    constructor() {
        this.defaultMaxAge = 60000 * 60 * 12; // 12 hours
        this.clearInterval = 60000 * 60; // 1 hour
        this.tableName = 'sessions';
        this.cookieName = 'appsch.sid';
    }

    /**
     * Get session max age from environment or default
     * @returns {number} Session max age in milliseconds
     */
    getMaxAge() {
        return parseInt(process.env.SESSION_MAX_AGE) || this.defaultMaxAge;
    }

    /**
     * Check if session should be secure
     * @returns {boolean} Whether to use secure cookies
     */
    isSecure() {
        return process.env.SESSION_SECURE === 'true' || 
               process.env.NODE_ENV === 'production';
    }

    /**
     * Get SameSite cookie attribute
     * @returns {string} SameSite value
     */
    getSameSite() {
        return process.env.SESSION_SAME_SITE || 'strict';
    }

    /**
     * Get session secret from environment
     * @returns {string} Session secret
     */
    getSecret() {
        const secret = process.env.SESSION_SECRET || 
                      process.env.ACCESS_SECRET_KEY || 
                      'fallback-secret-change-in-production';

        if (!process.env.SESSION_SECRET) {
            console.warn('⚠️  WARNING: SESSION_SECRET not set in environment variables. Using fallback.');
            console.warn('⚠️  For production, please set SESSION_SECRET in .env file.');
        }

        return secret;
    }

    /**
     * Create session store using Knex
     * @param {Object} knexInstance - Knex instance
     * @returns {Object} Session store
     */
    createStore(knexInstance) {
        return new ConnectSessionKnexStore({
            knex: knexInstance,
            tablename: this.tableName,
            sidfieldname: 'sid',
            createtable: true,
            clearInterval: this.clearInterval
        });
    }

    /**
     * Get cookie configuration
     * @returns {Object} Cookie configuration object
     */
    getCookieConfig() {
        return {
            maxAge: this.getMaxAge(),
            httpOnly: true,
            secure: this.isSecure(),
            sameSite: this.getSameSite()
        };
    }

    /**
     * Create session middleware
     * @param {Object} knexInstance - Knex instance
     * @returns {Function} Express session middleware
     */
    createSession(knexInstance) {
        return session({
            secret: this.getSecret(),
            store: this.createStore(knexInstance),
            saveUninitialized: false,
            resave: false,
            name: this.cookieName,
            cookie: this.getCookieConfig(),
            rolling: true
        });
    }

    /**
     * Get session configuration object
     * @returns {Object} Session configuration
     */
    getConfig() {
        return {
            maxAge: this.getMaxAge(),
            secure: this.isSecure(),
            sameSite: this.getSameSite(),
            cookieName: this.cookieName,
            tableName: this.tableName
        };
    }
}

// Create singleton instance
const sessionConfig = new SessionConfig();

// Import knex for default session creation
const { knex } = require('./database');

// Export class and session middleware for backward compatibility
module.exports = {
    SessionConfig,
    session: sessionConfig.createSession(knex),
    createSession: (knexInstance) => sessionConfig.createSession(knexInstance),
    getConfig: () => sessionConfig.getConfig()
};
