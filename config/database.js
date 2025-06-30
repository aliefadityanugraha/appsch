const knex = require('knex');
const { Model } = require('objection');
const fs = require('fs');

// Fungsi untuk mengambil opsi SSL jika tersedia
function getSSLOptions() {
    const sslCaPath = process.env.DB_SSL_CA;
    if (sslCaPath && fs.existsSync(sslCaPath)) {
        return {
            ca: fs.readFileSync(sslCaPath)
        };
    }
    return undefined;
}

// --- Knex/Objection.js Configuration ---
const dbConfig = {
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'appsch',
        ssl: getSSLOptions(),
        multipleStatements: true
    },
    pool: { min: 2, max: 10 }
};

const knexInstance = knex(dbConfig);
Model.knex(knexInstance);

/**
 * Check database connection (Objection/Knex)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function checkObjectionConnection() {
    try {
        await knexInstance.raw('SELECT 1');
        console.log('✅ Database connection successful (Objection/Knex)');
        return { success: true };
    } catch (error) {
        console.error('❌ Database connection failed (Objection/Knex):', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Close database connection
 */
async function closeDatabaseConnection() {
    try {
        await knexInstance.destroy();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error closing database connection:', error);
    }
}

module.exports = {
    knex: knexInstance,
    checkObjectionConnection,
    closeDatabaseConnection
}; 