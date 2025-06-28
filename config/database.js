const { PrismaClient } = require('@prisma/client');
const knex = require('knex');
const { Model } = require('objection');

const prisma = new PrismaClient();

// Knex configuration for Objection.js
const knexConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'appsch',
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }
};

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
        await knexInstance.raw('SELECT 1');
        console.log('✅ Database connection successful (Objection.js)');
        return { success: true };
    } catch (error) {
        console.error('❌ Database connection failed (Objection.js):', error.message);
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