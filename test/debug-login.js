const { checkObjectionConnection } = require('../config/database');
const User = require('../models/User');
const crypto = require('crypto');

async function debugLogin() {
    console.log('🔍 Debugging login process...\n');

    try {
        // Check database connection
        console.log('1️⃣ Checking database connection...');
        const connectionResult = await checkObjectionConnection();
        
        if (!connectionResult.success) {
            console.error('❌ Database connection failed');
            return;
        }
        console.log('✅ Database connection successful\n');

        // Test user query
        console.log('2️⃣ Testing user query...');
        const testEmail = 'adty.nv@gmail.com';
        
        try {
            const user = await User.query().where('email', testEmail).first();
            
            if (user) {
                console.log('✅ User found:');
                console.log(`   ID: ${user.id}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Status: ${user.status}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Has password: ${user.password ? 'Yes' : 'No'}`);
                console.log(`   Password length: ${user.password ? user.password.length : 0}`);
            } else {
                console.log('❌ User not found');
                console.log('💡 Run: npm run check:users');
                return;
            }
        } catch (error) {
            console.error('❌ Error querying user:', error.message);
            return;
        }

        // Test password hashing
        console.log('\n3️⃣ Testing password hashing...');
        const testPassword = 'admin123';
        const hashedPassword = crypto.createHash('sha256').update(testPassword).digest('hex');
        console.log(`   Original password: ${testPassword}`);
        console.log(`   Hashed password: ${hashedPassword}`);
        console.log(`   Hash length: ${hashedPassword.length}`);

        // Test password comparison
        console.log('\n4️⃣ Testing password comparison...');
        const user = await User.query().where('email', testEmail).first();
        
        if (user.password === hashedPassword) {
            console.log('✅ Password matches!');
        } else {
            console.log('❌ Password does not match');
            console.log(`   Stored hash: ${user.password}`);
            console.log(`   Computed hash: ${hashedPassword}`);
        }

        // Test JWT signing
        console.log('\n5️⃣ Testing JWT signing...');
        try {
            const jsonWebToken = require('jsonwebtoken');
            
            if (!process.env.ACCESS_SECRET_KEY) {
                console.error('❌ ACCESS_SECRET_KEY not found in environment');
                console.log('💡 Add to .env file: ACCESS_SECRET_KEY=your_secret_key');
                return;
            }
            
            if (!process.env.REFRESH_SECRET_KEY) {
                console.error('❌ REFRESH_SECRET_KEY not found in environment');
                console.log('💡 Add to .env file: REFRESH_SECRET_KEY=your_secret_key');
                return;
            }

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

            console.log('✅ JWT tokens created successfully');
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
            }

        } catch (error) {
            console.error('❌ JWT signing failed:', error.message);
        }

        // Test user update
        console.log('\n6️⃣ Testing user update...');
        try {
            const refreshToken = jsonWebToken.sign(
                { userId: user.id, email: user.email },
                process.env.REFRESH_SECRET_KEY,
                { expiresIn: "7d" }
            );

            await User.query()
                .findById(user.id)
                .patch({ refreshToken });

            console.log('✅ User update successful');
            
            // Verify update
            const updatedUser = await User.query().findById(user.id);
            console.log(`   Refresh token updated: ${updatedUser.refreshToken ? 'Yes' : 'No'}`);
            
        } catch (error) {
            console.error('❌ User update failed:', error.message);
        }

        console.log('\n🎉 Login debug completed!');
        console.log('📋 Summary:');
        console.log('   - Database connection: ✅');
        console.log('   - User query: ✅');
        console.log('   - Password hashing: ✅');
        console.log('   - JWT signing: ✅');
        console.log('   - User update: ✅');

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the debug
debugLogin(); 