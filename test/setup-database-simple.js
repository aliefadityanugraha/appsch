const mysql = require('mysql2');
require('dotenv').config();

function setupDatabase() {
    console.log('🔧 Setting up database for Objection.js (Simple Version)...\n');

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

    // Create connection without database
    const connection = mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
    });

    console.log('🔌 Connecting to MySQL server...');

    connection.connect((err) => {
        if (err) {
            console.error('❌ Failed to connect to MySQL server:', err.message);
            if (err.code === 'ECONNREFUSED') {
                console.error('💡 Cannot connect to MySQL server. Please check:');
                console.error('   - MySQL server is running');
                console.error('   - Host and port are correct');
            } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
                console.error('💡 Access denied. Please check:');
                console.error('   - Username and password are correct');
            }
            process.exit(1);
        }

        console.log('✅ Connected to MySQL server\n');

        // Check if database exists
        console.log('🔍 Checking if database exists...');
        connection.query(
            `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${config.database}'`,
            (err, rows) => {
                if (err) {
                    console.error('❌ Error checking database:', err.message);
                    connection.end();
                    process.exit(1);
                }

                if (rows.length === 0) {
                    console.log(`❌ Database '${config.database}' does not exist`);
                    console.log(`🔧 Creating database '${config.database}'...`);
                    
                    connection.query(`CREATE DATABASE \`${config.database}\``, (err) => {
                        if (err) {
                            console.error('❌ Error creating database:', err.message);
                            connection.end();
                            process.exit(1);
                        }
                        
                        console.log(`✅ Database '${config.database}' created successfully\n`);
                        testDatabaseConnection();
                    });
                } else {
                    console.log(`✅ Database '${config.database}' already exists\n`);
                    testDatabaseConnection();
                }
            }
        );
    });

    function testDatabaseConnection() {
        console.log('🧪 Testing connection to the database...');
        
        // Create new connection to the specific database
        const dbConnection = mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
        });

        dbConnection.connect((err) => {
            if (err) {
                console.error('❌ Error connecting to database:', err.message);
                dbConnection.end();
                connection.end();
                process.exit(1);
            }

            console.log('✅ Successfully connected to the database\n');
            console.log('🎉 Database setup completed successfully!');
            console.log('🚀 You can now run: npm run dev:objection');
            
            dbConnection.end();
            connection.end();
            console.log('🔌 Database connections closed');
        });
    }
}

// Run the setup
setupDatabase(); 