const mysql = require('mysql2');
require('dotenv').config();

function checkDatabase() {
    console.log('🔍 Checking database status...\n');

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

    // Test connection to MySQL server
    console.log('🔌 Testing MySQL server connection...');
    const serverConnection = mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
    });

    serverConnection.connect((err) => {
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
            serverConnection.end();
            process.exit(1);
        }

        console.log('✅ MySQL server connection successful\n');

        // Check if database exists
        console.log('🔍 Checking if database exists...');
        serverConnection.query(
            `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${config.database}'`,
            (err, rows) => {
                if (err) {
                    console.error('❌ Error checking database:', err.message);
                    serverConnection.end();
                    process.exit(1);
                }

                if (rows.length === 0) {
                    console.log(`❌ Database '${config.database}' does not exist`);
                    console.log('💡 Run: npm run setup:db:simple');
                    serverConnection.end();
                    process.exit(1);
                }

                console.log(`✅ Database '${config.database}' exists\n`);

                // Test connection to the specific database
                console.log('🧪 Testing database connection...');
                const dbConnection = mysql.createConnection({
                    host: config.host,
                    port: config.port,
                    user: config.user,
                    password: config.password,
                    database: config.database,
                });

                dbConnection.connect((err) => {
                    if (err) {
                        console.error('❌ Failed to connect to database:', err.message);
                        dbConnection.end();
                        serverConnection.end();
                        process.exit(1);
                    }

                    console.log('✅ Database connection successful\n');

                    // Check if tables exist
                    console.log('🔍 Checking if tables exist...');
                    dbConnection.query('SHOW TABLES', (err, tables) => {
                        if (err) {
                            console.error('❌ Error checking tables:', err.message);
                            dbConnection.end();
                            serverConnection.end();
                            process.exit(1);
                        }

                        if (tables.length === 0) {
                            console.log('❌ No tables found in database');
                            console.log('💡 Run: npm run setup:tables');
                            dbConnection.end();
                            serverConnection.end();
                            process.exit(1);
                        }

                        console.log(`✅ Found ${tables.length} tables in database:`);
                        tables.forEach(table => {
                            const tableName = Object.values(table)[0];
                            console.log(`   - ${tableName}`);
                        });

                        console.log('\n🎉 Database is ready for Objection.js!');
                        console.log('🚀 You can now run: npm run dev:objection');

                        dbConnection.end();
                        serverConnection.end();
                        console.log('🔌 Database connections closed');
                    });
                });
            }
        );
    });
}

// Run the check
checkDatabase(); 