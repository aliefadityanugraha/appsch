const { execSync } = require('child_process');
const { checkObjectionConnection } = require('../config/database');

async function setupTables() {
    console.log('🔧 Setting up database tables...\n');

    try {
        // First check if Objection.js can connect
        console.log('🔍 Checking database connection...');
        const connectionResult = await checkObjectionConnection();
        
        if (!connectionResult.success) {
            console.error('❌ Cannot connect to database. Please run setup:db first.');
            console.error('💡 Run: npm run setup:db');
            process.exit(1);
        }

        console.log('✅ Database connection successful\n');

        // Check if tables exist by trying to query one of them using raw query
        console.log('🔍 Checking if tables exist...');
        const { knex } = require('../config/database');
        
        try {
            await knex.raw('SELECT COUNT(*) as count FROM User LIMIT 1');
            console.log('✅ Tables already exist!\n');
        } catch (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') {
                console.log('❌ Tables do not exist. Please create tables manually or via Knex migration.\n');
                process.exit(1);
            } else {
                throw error;
            }
        }

        // Test Objection.js with the tables
        console.log('🧪 Testing Objection.js with existing tables...');
        const User = require('../models/User');
        const userCount = await User.query().resultSize();
        console.log(`✅ Objection.js working! Found ${userCount} users in database\n`);

        console.log('🎉 Database tables setup completed successfully!');
        console.log('🚀 You can now run: npm run dev:objection');

    } catch (error) {
        console.error('❌ Table setup failed:', error.message);
        process.exit(1);
    }
}

// Run the setup
setupTables(); 