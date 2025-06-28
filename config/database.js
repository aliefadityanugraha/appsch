const { PrismaClient } = require('@prisma/client');
const knex = require('knex');
const { Model } = require('objection');

const prisma = new PrismaClient();

// Parse DATABASE_URL for Objection.js configuration
function parseDatabaseUrl() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
        console.warn('⚠️ DATABASE_URL not found, using fallback configuration');
        return {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'appsch',
        };
    }

    // Parse DATABASE_URL format: mysql://user:password@host:port/database
    const url = new URL(databaseUrl);
    return {
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.substring(1), // Remove leading slash
    };
}

// Knex configuration for Objection.js
const knexConfig = {
    client: 'mysql2',
    connection: parseDatabaseUrl(),
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        tableName: 'knex_migrations'
    },
    debug: process.env.NODE_ENV === 'development'
};

console.log('🔧 Objection.js Database Config:', {
    host: knexConfig.connection.host,
    port: knexConfig.connection.port,
    user: knexConfig.connection.user,
    database: knexConfig.connection.database
});

const knexInstance = knex(knexConfig);

// Bind Objection.js to Knex
Model.knex(knexInstance);

/**
 * Check database connection (Prisma)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function checkDatabaseConnection() {
    try {
        // Test the connection by running a simple query
        await prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database connection successful (Prisma)');
        return { success: true };
    } catch (error) {
        console.error('❌ Database connection failed (Prisma):', error.message);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

/**
 * Check database connection (Objection.js)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function checkObjectionConnection() {
    try {
        // Test the connection by running a simple query
        await knexInstance.raw('SELECT 1');
        console.log('✅ Database connection successful (Objection.js)');
        return { success: true };
    } catch (error) {
        console.error('❌ Database connection failed (Objection.js):', error.message);
        
        // Provide more detailed error information
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 Database does not exist. Please create the database first.');
            console.error('💡 You can create it using: CREATE DATABASE appsch;');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('💡 Cannot connect to database server. Please check if MySQL is running.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Access denied. Please check username and password.');
        }
        
        return { 
            success: false, 
            error: error.message 
        };
    }
}

/**
 * Close database connection
 */
async function closeDatabaseConnection() {
    try {
        await prisma.$disconnect();
        await knexInstance.destroy();
        console.log('Database connections closed');
    } catch (error) {
        console.error('Error closing database connections:', error);
    }
}

module.exports = {
    prisma,
    knex: knexInstance,
    checkDatabaseConnection,
    checkObjectionConnection,
    closeDatabaseConnection
}; 