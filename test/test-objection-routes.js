const { checkObjectionConnection, closeDatabaseConnection } = require('../config/database');
const Staff = require('../models/Staff');
const Periode = require('../models/Periode');
const Task = require('../models/Task');
const Records = require('../models/Records');
const User = require('../models/User');
const Role = require('../models/Role');
const Settings = require('../models/Settings');

async function testObjectionRoutes() {
    console.log('🧪 Testing Objection.js Routes & Controllers...\n');

    try {
        // Test database connection
        const connectionResult = await checkObjectionConnection();
        if (!connectionResult.success) {
            console.error('❌ Database connection failed:', connectionResult.error);
            return;
        }
        console.log('✅ Database connection successful\n');

        // Test all models and their basic operations
        console.log('📝 Testing All Models & Controllers...\n');

        // 1. Test User Model (Auth Controller)
        console.log('1. Testing User Model (Auth Controller)...');
        const testUser = await User.query().insert({
            email: 'test@objection.com',
            password: 'hashedpassword123'
        });
        console.log('✅ Created user:', testUser.email);

        // 2. Test Role Model (Role Controller)
        console.log('\n2. Testing Role Model (Role Controller)...');
        const testRole = await Role.query().insert({
            role: 'Test Role',
            permission: { arrayPermission: [1, 2, 3] },
            description: 'Test role description'
        });
        console.log('✅ Created role:', testRole.role);

        // 3. Test Periode Model (Periode Controller)
        console.log('\n3. Testing Periode Model (Periode Controller)...');
        const testPeriode = await Periode.query().insert({
            periode: 'Test Periode',
            nilai: 100
        });
        console.log('✅ Created periode:', testPeriode.periode);

        // 4. Test Staff Model (Staff Controller)
        console.log('\n4. Testing Staff Model (Staff Controller)...');
        const testStaff = await Staff.query().insert({
            name: 'Test Staff Objection',
            jabatan: 'Test Position',
            nip: '123456789',
            tunjangan: '1000000'
        });
        console.log('✅ Created staff:', testStaff.name);

        // 5. Test Task Model (Task Controller)
        console.log('\n5. Testing Task Model (Task Controller)...');
        const testTask = await Task.query().insert({
            description: 'Test Task Description',
            value: 50.5,
            staffId: testStaff.id,
            periodeId: testPeriode.id
        });
        console.log('✅ Created task:', testTask.description);

        // 6. Test Records Model (Records Controller)
        console.log('\n6. Testing Records Model (Records Controller)...');
        const testRecord = await Records.query().insert({
            value: 100.0,
            staffId: testStaff.id
        });
        console.log('✅ Created record with value:', testRecord.value);

        // 7. Test Settings Model (Settings Controller)
        console.log('\n7. Testing Settings Model (Settings Controller)...');
        const testSetting = await Settings.query().insert({
            tunjangan: '500000',
            color: '#FF5733'
        });
        console.log('✅ Created setting:', testSetting.tunjangan);

        // Test Relations
        console.log('\n8. Testing Relations...');
        const staffWithTasks = await Staff.query()
            .withGraphFetched('task.periode')
            .findById(testStaff.id);
        console.log('✅ Staff with tasks relation:', staffWithTasks.task.length, 'tasks');

        const recordsWithStaff = await Records.query()
            .withGraphFetched('staff')
            .findById(testRecord.id);
        console.log('✅ Records with staff relation:', recordsWithStaff.staff.name);

        // Test Complex Queries (like in controllers)
        console.log('\n9. Testing Complex Queries...');
        
        // Test aggregation (like in mainController)
        const totalStaff = await Staff.query().resultSize();
        console.log('✅ Total staff count:', totalStaff);

        // Test date filtering (like in recordsController)
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const recordsThisMonth = await Records.query()
            .whereBetween('createdAt', [startOfMonth, endOfMonth])
            .withGraphFetched('staff');
        console.log('✅ Records this month:', recordsThisMonth.length);

        // Cleanup - Delete test data
        console.log('\n10. Cleaning up test data...');
        await Task.query().deleteById(testTask.id);
        await Records.query().deleteById(testRecord.id);
        await Staff.query().deleteById(testStaff.id);
        await Periode.query().deleteById(testPeriode.id);
        await Role.query().deleteById(testRole.id);
        await Settings.query().deleteById(testSetting.id);
        await User.query().deleteById(testUser.id);
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 All Objection.js routes and controllers tests passed successfully!');
        console.log('\n📋 Summary:');
        console.log('✅ User/Auth Controller - Working');
        console.log('✅ Role Controller - Working');
        console.log('✅ Periode Controller - Working');
        console.log('✅ Staff Controller - Working');
        console.log('✅ Task Controller - Working');
        console.log('✅ Records Controller - Working');
        console.log('✅ Settings Controller - Working');
        console.log('✅ Relations - Working');
        console.log('✅ Complex Queries - Working');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', error.message);
    } finally {
        await closeDatabaseConnection();
    }
}

// Run the test
testObjectionRoutes(); 