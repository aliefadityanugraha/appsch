const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    console.log('🔧 Setting up database for Objection.js...\n');

    // Parse DATABASE_URL or use fallback
    function getDatabaseConfig() {
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

        const url = new URL(databaseUrl);
        return {
            host: url.hostname,
            port: parseInt(url.port) || 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.substring(1),
        };
    }

    const config = getDatabaseConfig();
    
    console.log('📋 Database Configuration:');
    console.log(`Host: ${config.host}`);
    console.log(`Port: ${config.port}`);
    console.log(`User: ${config.user}`);
    console.log(`Database: ${config.database}\n`);

    let connection;

    try {
        // Connect without specifying database first
        const connectionConfig = {
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
        };

        console.log('🔌 Connecting to MySQL server...');
        connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Connected to MySQL server\n');

        // Check if database exists using raw query instead of prepared statement
        console.log('🔍 Checking if database exists...');
        const [rows] = await connection.query(
            `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${config.database}'`
        );

        if (rows.length === 0) {
            console.log(`❌ Database '${config.database}' does not exist`);
            console.log(`🔧 Creating database '${config.database}'...`);
            
            await connection.query(`CREATE DATABASE \`${config.database}\``);
            console.log(`✅ Database '${config.database}' created successfully\n`);
        } else {
            console.log(`✅ Database '${config.database}' already exists\n`);
        }

        // Test connection to the specific database using raw query
        console.log('🧪 Testing connection to the database...');
        await connection.query(`USE \`${config.database}\``);
        await connection.query('SELECT 1');
        console.log('✅ Successfully connected to the database\n');

        console.log('🎉 Database setup completed successfully!');
        console.log('🚀 You can now run: npm run dev:objection');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Cannot connect to MySQL server. Please check:');
            console.error('   - MySQL server is running');
            console.error('   - Host and port are correct');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Access denied. Please check:');
            console.error('   - Username and password are correct');
            console.error('   - User has CREATE DATABASE privileges');
        } else if (error.code === 'ER_DBACCESS_DENIED_ERROR') {
            console.error('💡 Database access denied. Please check:');
            console.error('   - User has access to the database');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the setup
setupDatabase(); 