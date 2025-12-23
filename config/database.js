"use strict";

require('dotenv').config();
const knex = require('knex');
const { Model } = require('objection');
const fs = require('fs');

/**
 * Database Configuration Class
 * Handles database connection using Knex and Objection.js
 */
class DatabaseConfig {
    constructor() {
        this.knexInstance = null;
        this.isConnected = false;
    }

    /**
     * Get SSL options for database connection
     * @returns {Object} SSL configuration object
     */
    getSSLOptions() {
        const sslCaPath = process.env.DB_SSL_CA;
        if (sslCaPath && fs.existsSync(sslCaPath)) {
            return {
                ca: fs.readFileSync(sslCaPath),
                rejectUnauthorized: true
            };
        }
        // For TiDB Cloud, force SSL
        return {
            rejectUnauthorized: true
        };
    }

    /**
     * Get database configuration object
     * @returns {Object} Knex configuration object
     */
    getConfig() {
        return {
            client: 'mysql2',
            connection: {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'appsch',
                ssl: this.getSSLOptions(),
                multipleStatements: true
            },
            pool: {
                min: 2,
                max: 10,
                acquireTimeoutMillis: 30000,
                idleTimeoutMillis: 30000,
                createTimeoutMillis: 30000
            },
            acquireConnectionTimeout: 10000
        };
    }

    /**
     * Initialize database connection
     * @returns {Object} Knex instance
     */
    initialize() {
        if (!this.knexInstance) {
            this.knexInstance = knex(this.getConfig());
            Model.knex(this.knexInstance);
        }
        return this.knexInstance;
    }

    /**
     * Get Knex instance
     * @returns {Object} Knex instance
     */
    getKnex() {
        if (!this.knexInstance) {
            this.initialize();
        }
        return this.knexInstance;
    }

    /**
     * Check database connection
     * @returns {Promise<{success: boolean, error?: string}>} Connection status
     */
    async checkConnection() {
        try {
            const knexInst = this.getKnex();
            await knexInst.raw('SELECT 1');
            this.isConnected = true;
            console.log('✅ Database connection successful (Objection/Knex)');
            return { success: true };
        } catch (error) {
            this.isConnected = false;
            console.error('❌ Database connection failed (Objection/Knex):', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Close database connection
     * @returns {Promise<void>}
     */
    async closeConnection() {
        try {
            if (this.knexInstance) {
                await this.knexInstance.destroy();
                this.knexInstance = null;
                this.isConnected = false;
                console.log('Database connection closed');
            }
        } catch (error) {
            console.error('Error closing database connection:', error);
        }
    }

    /**
     * Execute raw SQL query
     * @param {string} sql - SQL query string
     * @param {Array} bindings - Query bindings
     * @returns {Promise<*>} Query result
     */
    async raw(sql, bindings = []) {
        const knexInst = this.getKnex();
        return knexInst.raw(sql, bindings);
    }

    /**
     * Get connection status
     * @returns {boolean} Whether database is connected
     */
    getConnectionStatus() {
        return this.isConnected;
    }
}

// Create singleton instance
const databaseConfig = new DatabaseConfig();

// Initialize on module load
databaseConfig.initialize();

// Export class and convenience methods for backward compatibility
module.exports = {
    DatabaseConfig,
    knex: databaseConfig.getKnex(),
    checkObjectionConnection: () => databaseConfig.checkConnection(),
    closeDatabaseConnection: () => databaseConfig.closeConnection()
};
