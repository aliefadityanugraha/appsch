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
            console.log('✅ Tables already exist (Prisma migrations applied)\n');
        } catch (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') {
                console.log('❌ Tables do not exist. Running Prisma migrations...\n');
                
                try {
                    // Run Prisma migrations
                    console.log('🔄 Running Prisma migrations...');
                    execSync('npx prisma migrate deploy', { 
                        stdio: 'inherit',
                        cwd: process.cwd()
                    });
                    console.log('✅ Prisma migrations completed successfully\n');
                    
                    // Generate Prisma client
                    console.log('🔄 Generating Prisma client...');
                    execSync('npx prisma generate', { 
                        stdio: 'inherit',
                        cwd: process.cwd()
                    });
                    console.log('✅ Prisma client generated\n');
                    
                } catch (migrationError) {
                    console.error('❌ Prisma migration failed:', migrationError.message);
                    console.error('💡 Please check your DATABASE_URL and run migrations manually:');
                    console.error('   npx prisma migrate deploy');
                    process.exit(1);
                }
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