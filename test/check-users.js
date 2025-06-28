const { checkObjectionConnection } = require('../config/database');
const User = require('../models/User');
const crypto = require('crypto');

async function checkUsers() {
    console.log('🔍 Checking users in database...\n');

    try {
        // Check database connection
        const connectionResult = await checkObjectionConnection();
        
        if (!connectionResult.success) {
            console.error('❌ Cannot connect to database');
            console.error('💡 Run: npm run setup:db:simple');
            process.exit(1);
        }

        console.log('✅ Database connection successful\n');

        // Check if User table exists
        console.log('🔍 Checking User table...');
        const { knex } = require('../config/database');
        
        try {
            await knex.raw('SELECT COUNT(*) as count FROM User');
            console.log('✅ User table exists\n');
        } catch (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') {
                console.error('❌ User table does not exist');
                console.error('💡 Run: npm run setup:tables');
                process.exit(1);
            } else {
                throw error;
            }
        }

        // Get all users
        console.log('👥 Checking existing users...');
        const users = await User.query();
        
        console.log(`📊 Found ${users.length} users in database:`);
        
        if (users.length === 0) {
            console.log('   - No users found');
        } else {
            users.forEach((user, index) => {
                console.log(`   ${index + 1}. ID: ${user.id}`);
                console.log(`      Email: ${user.email}`);
                console.log(`      Status: ${user.status ? 'Active' : 'Inactive'}`);
                console.log(`      Role: ${user.role}`);
                console.log(`      Created: ${user.createdAt}`);
                console.log('');
            });
        }

        // Create test user if no users exist
        if (users.length === 0) {
            console.log('🔧 Creating test user...');
            
            const testEmail = 'admin@test.com';
            const testPassword = 'admin123';
            const hashedPassword = crypto.createHash('sha256').update(testPassword).digest('hex');
            
            try {
                const newUser = await User.query().insert({
                    email: testEmail,
                    password: hashedPassword,
                    status: true,
                    role: 1
                });
                
                console.log('✅ Test user created successfully!');
                console.log(`   Email: ${testEmail}`);
                console.log(`   Password: ${testPassword}`);
                console.log(`   ID: ${newUser.id}`);
                console.log('');
                console.log('🔑 You can now login with these credentials');
                
            } catch (error) {
                console.error('❌ Error creating test user:', error.message);
                
                if (error.code === 'ER_DUP_ENTRY') {
                    console.error('💡 User with this email already exists');
                } else {
                    console.error('💡 Check database permissions and table structure');
                }
            }
        } else {
            console.log('✅ Users exist in database');
            console.log('🔑 You can login with any existing user credentials');
        }

        // Test user query
        console.log('🧪 Testing user query...');
        const testUser = await User.query().where('email', 'admin@test.com').first();
        
        if (testUser) {
            console.log('✅ User query working correctly');
            console.log(`   Found user: ${testUser.email}`);
        } else {
            console.log('⚠️ No user found with email: admin@test.com');
        }

    } catch (error) {
        console.error('❌ Error checking users:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the check
checkUsers(); 