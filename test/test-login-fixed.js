const { checkObjectionConnection } = require('../config/database');
const User = require('../models/User');
const crypto = require('crypto');
const jsonWebToken = require('jsonwebtoken');

async function testLoginFixed() {
    console.log('🧪 Testing login process with datetime fix...\n');

    try {
        // Check database connection
        console.log('1️⃣ Checking database connection...');
        const connectionResult = await checkObjectionConnection();
        
        if (!connectionResult.success) {
            console.error('❌ Database connection failed');
            return;
        }
        console.log('✅ Database connection successful\n');

        // Test email
        const testEmail = 'adty.nv@gmail.com';
        const testPassword = '123';

        console.log('2️⃣ Testing with credentials:');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: ${testPassword}\n`);

        // Test user query
        console.log('3️⃣ Testing user query...');
        const user = await User.findByEmail(testEmail);
        
        if (!user) {
            console.log('❌ User not found');
            console.log('💡 Run: npm run check:users');
            return;
        }

        console.log('✅ User found successfully\n');

        // Test password hashing
        console.log('4️⃣ Testing password hashing...');
        const hashedPassword = crypto.createHash('sha256').update(testPassword).digest('hex');
        console.log(`   Original password: ${testPassword}`);
        console.log(`   Hashed password: ${hashedPassword}`);
        console.log(`   Hash length: ${hashedPassword.length}`);

        // Test password comparison
        console.log('\n5️⃣ Testing password comparison...');
        console.log(`   Stored hash: ${user.password}`);
        console.log(`   Computed hash: ${hashedPassword}`);
        console.log(`   Match: ${user.password === hashedPassword}`);

        if (user.password !== hashedPassword) {
            console.log('❌ Password does not match');
            console.log('💡 Check if user was created with correct password');
            return;
        }

        console.log('✅ Password verified successfully\n');

        // Test JWT secrets
        console.log('6️⃣ Testing JWT secrets...');
        if (!process.env.ACCESS_SECRET_KEY) {
            console.error('❌ ACCESS_SECRET_KEY not found');
            console.log('💡 Add to .env file: ACCESS_SECRET_KEY=your_secret_key');
            return;
        }
        
        if (!process.env.REFRESH_SECRET_KEY) {
            console.error('❌ REFRESH_SECRET_KEY not found');
            console.log('💡 Add to .env file: REFRESH_SECRET_KEY=your_secret_key');
            return;
        }

        console.log('✅ JWT secrets found\n');

        // Test JWT signing
        console.log('7️⃣ Testing JWT signing...');
        const accessToken = jsonWebToken.sign(
            { userId: user.id, email: user.email },
            process.env.ACCESS_SECRET_KEY,
            { expiresIn: "15m" }
        );

        const refreshToken = jsonWebToken.sign(
            { userId: user.id, email: user.email },
            process.env.REFRESH_SECRET_KEY,
            { expiresIn: "7d" }
        );

        console.log('✅ JWT tokens created:');
        console.log(`   Access token length: ${accessToken.length}`);
        console.log(`   Refresh token length: ${refreshToken.length}`);

        // Test token verification
        try {
            const decoded = jsonWebToken.verify(accessToken, process.env.ACCESS_SECRET_KEY);
            console.log('✅ Access token verification successful');
            console.log(`   Decoded userId: ${decoded.userId}`);
            console.log(`   Decoded email: ${decoded.email}`);
        } catch (error) {
            console.error('❌ Access token verification failed:', error.message);
            return;
        }

        // Test user update with fixed datetime
        console.log('\n8️⃣ Testing user update with fixed datetime...');
        await User.updateRefreshToken(user.id, refreshToken);
        console.log('✅ User update successful');

        // Verify update
        const updatedUser = await User.findByEmail(testEmail);
        console.log(`   Refresh token updated: ${updatedUser.refreshToken ? 'Yes' : 'No'}`);
        console.log(`   Updated at: ${updatedUser.updatedAt}`);

        console.log('\n🎉 Login test completed successfully!');
        console.log('📋 Summary:');
        console.log('   - Database connection: ✅');
        console.log('   - User query: ✅');
        console.log('   - Password verification: ✅');
        console.log('   - JWT signing: ✅');
        console.log('   - Token verification: ✅');
        console.log('   - User update (datetime fixed): ✅');

        console.log('\n🔑 Login should now work with these credentials:');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: ${testPassword}`);

    } catch (error) {
        console.error('❌ Login test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testLoginFixed(); 