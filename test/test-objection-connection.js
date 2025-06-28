const { checkObjectionConnection, closeDatabaseConnection } = require('../config/database');
const Staff = require('../models/Staff');
const Periode = require('../models/Periode');

async function testObjectionConnection() {
    console.log('🧪 Testing Objection.js Connection...\n');

    try {
        // Test database connection
        const connectionResult = await checkObjectionConnection();
        if (!connectionResult.success) {
            console.error('❌ Database connection failed:', connectionResult.error);
            return;
        }
        console.log('✅ Database connection successful\n');

        // Test basic CRUD operations
        console.log('📝 Testing CRUD Operations...\n');

        // Test Create
        console.log('1. Testing CREATE...');
        const testStaff = await Staff.query().insert({
            name: 'Test Staff Objection',
            jabatan: 'Test Position',
            nip: '123456789',
            tunjangan: '1000000'
        });
        console.log('✅ Created staff:', testStaff.name);

        // Test Read
        console.log('\n2. Testing READ...');
        const allStaff = await Staff.query();
        console.log('✅ Found', allStaff.length, 'staff records');

        // Test Update
        console.log('\n3. Testing UPDATE...');
        const updatedStaff = await Staff.query()
            .findById(testStaff.id)
            .patch({
                name: 'Updated Staff Objection'
            });
        console.log('✅ Updated staff name');

        // Test Read with relations
        console.log('\n4. Testing READ with relations...');
        const staffWithTasks = await Staff.query()
            .withGraphFetched('task.periode')
            .findById(testStaff.id);
        console.log('✅ Staff with relations:', staffWithTasks.name);

        // Test Delete
        console.log('\n5. Testing DELETE...');
        await Staff.query().deleteById(testStaff.id);
        console.log('✅ Deleted test staff');

        // Test Periode operations
        console.log('\n6. Testing Periode operations...');
        const testPeriode = await Periode.query().insert({
            periode: 'Test Periode',
            nilai: 100
        });
        console.log('✅ Created periode:', testPeriode.periode);

        await Periode.query().deleteById(testPeriode.id);
        console.log('✅ Deleted test periode');

        console.log('\n🎉 All tests passed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await closeDatabaseConnection();
    }
}

// Run the test
testObjectionConnection(); 