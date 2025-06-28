const { checkObjectionConnection } = require('../config/database');
const Records = require('../models/Records');
const Task = require('../models/Task');
const Staff = require('../models/Staff');

async function testDataEndpoint() {
    console.log('🧪 Testing /data endpoint directly...\n');

    try {
        // Check database connection
        console.log('1️⃣ Checking database connection...');
        const connectionResult = await checkObjectionConnection();
        
        if (!connectionResult.success) {
            console.error('❌ Database connection failed');
            return;
        }
        console.log('✅ Database connection successful\n');

        // Test date calculation (same as controller)
        console.log('2️⃣ Testing date calculation (same as controller)...');
        const thisDate = new Date();
        const startDate = new Date(`${thisDate.getFullYear()}-${thisDate.getMonth() + 1}-01`);
        const endDate = new Date(`${thisDate.getFullYear()}-${thisDate.getMonth() + 1}-31`);
        
        console.log('   Current date:', thisDate);
        console.log('   Start date:', startDate);
        console.log('   End date:', endDate);
        console.log('   Start date ISO:', startDate.toISOString());
        console.log('   End date ISO:', endDate.toISOString());

        // Test basic Records query
        console.log('\n3️⃣ Testing basic Records query...');
        const allRecords = await Records.query();
        console.log(`   Total records in database: ${allRecords.length}`);
        
        if (allRecords.length === 0) {
            console.log('⚠️ No records found in database');
            console.log('💡 You may need to create some test data');
        } else {
            console.log('   Sample record:');
            console.log('     ID:', allRecords[0].id);
            console.log('     Value:', allRecords[0].value);
            console.log('     StaffId:', allRecords[0].staffId);
            console.log('     CreatedAt:', allRecords[0].createdAt);
            console.log('     UpdatedAt:', allRecords[0].updatedAt);
        }

        // Test Records with date filter
        console.log('\n4️⃣ Testing Records with date filter...');
        const recordsWithDate = await Records.query()
            .whereBetween('createdAt', [startDate, endDate]);
        console.log(`   Records in current month: ${recordsWithDate.length}`);

        // Test Staff model
        console.log('\n5️⃣ Testing Staff model...');
        const staffCount = await Staff.query().resultSize();
        console.log(`   Total staff: ${staffCount}`);
        
        if (staffCount === 0) {
            console.log('⚠️ No staff found in database');
            console.log('💡 You may need to create some test staff');
        } else {
            const sampleStaff = await Staff.query().first();
            console.log('   Sample staff:');
            console.log('     ID:', sampleStaff.id);
            console.log('     Name:', sampleStaff.name);
            console.log('     Jabatan:', sampleStaff.jabatan);
            console.log('     NIP:', sampleStaff.nip);
        }

        // Test Task model
        console.log('\n6️⃣ Testing Task model...');
        const taskCount = await Task.query().resultSize();
        console.log(`   Total tasks: ${taskCount}`);
        
        if (taskCount === 0) {
            console.log('⚠️ No tasks found in database');
            console.log('💡 You may need to create some test tasks');
        } else {
            const sampleTask = await Task.query().first();
            console.log('   Sample task:');
            console.log('     ID:', sampleTask.id);
            console.log('     Description:', sampleTask.description);
            console.log('     Value:', sampleTask.value);
            console.log('     StaffId:', sampleTask.staffId);
            console.log('     PeriodeId:', sampleTask.periodeId);
        }

        // Test Records with staff relation
        console.log('\n7️⃣ Testing Records with staff relation...');
        const recordsWithStaff = await Records.query()
            .withGraphFetched('staff');
        console.log(`   Records with staff relation: ${recordsWithStaff.length}`);
        
        if (recordsWithStaff.length > 0) {
            console.log('   Sample record with staff:');
            console.log('     Record ID:', recordsWithStaff[0].id);
            console.log('     Staff:', recordsWithStaff[0].staff ? 'Found' : 'Not found');
            if (recordsWithStaff[0].staff) {
                console.log('     Staff Name:', recordsWithStaff[0].staff.name);
                console.log('     Staff Jabatan:', recordsWithStaff[0].staff.jabatan);
                console.log('     Staff Tunjangan:', recordsWithStaff[0].staff.tunjangan);
            }
        }

        // Test Records with tasks relation
        console.log('\n8️⃣ Testing Records with tasks relation...');
        const recordsWithTasks = await Records.query()
            .withGraphFetched('tasks');
        console.log(`   Records with tasks relation: ${recordsWithTasks.length}`);
        
        if (recordsWithTasks.length > 0) {
            console.log('   Sample record with tasks:');
            console.log('     Record ID:', recordsWithTasks[0].id);
            console.log('     Tasks count:', recordsWithTasks[0].tasks ? recordsWithTasks[0].tasks.length : 0);
            if (recordsWithTasks[0].tasks && recordsWithTasks[0].tasks.length > 0) {
                console.log('     First task description:', recordsWithTasks[0].tasks[0].description);
                console.log('     First task value:', recordsWithTasks[0].tasks[0].value);
            }
        }

        // Test full query (exactly like in controller)
        console.log('\n9️⃣ Testing full query (exactly like in controller)...');
        const fullQuery = await Records.query()
            .whereBetween('createdAt', [startDate, endDate])
            .withGraphFetched('[staff, tasks]')
            .orderBy('createdAt', 'asc');
        
        console.log(`   Full query result: ${fullQuery.length} records`);
        console.log('✅ Full query successful!');
        
        if (fullQuery.length > 0) {
            console.log('   Sample full record:');
            console.log('     ID:', fullQuery[0].id);
            console.log('     Value:', fullQuery[0].value);
            console.log('     Staff:', fullQuery[0].staff ? fullQuery[0].staff.name : 'Not found');
            console.log('     Staff Jabatan:', fullQuery[0].staff ? fullQuery[0].staff.jabatan : 'Not found');
            console.log('     Staff Tunjangan:', fullQuery[0].staff ? fullQuery[0].staff.tunjangan : 'Not found');
            console.log('     Tasks count:', fullQuery[0].tasks ? fullQuery[0].tasks.length : 0);
        }

        console.log('\n🎉 Data endpoint test completed successfully!');
        console.log('📋 Summary:');
        console.log('   - Database connection: ✅');
        console.log('   - Date calculation: ✅');
        console.log('   - Basic Records query: ✅');
        console.log('   - Records with date filter: ✅');
        console.log('   - Staff model: ✅');
        console.log('   - Task model: ✅');
        console.log('   - Records with staff relation: ✅');
        console.log('   - Records with tasks relation: ✅');
        console.log('   - Full query (controller): ✅');

        console.log('\n🔗 The /data endpoint should now work correctly!');
        console.log('🌐 Try accessing: http://localhost:3333/data');

    } catch (error) {
        console.error('❌ Data endpoint test failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        // More specific error messages
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.error('\n💡 Issue: Table does not exist');
            console.error('   Solution: Run npm run setup:tables');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Issue: Cannot connect to database');
            console.error('   Solution: Check MySQL server');
        } else if (error.message.includes('datetime')) {
            console.error('\n💡 Issue: Datetime format error');
            console.error('   Solution: Check model datetime format');
        } else if (error.message.includes('relation')) {
            console.error('\n💡 Issue: Relation error');
            console.error('   Solution: Check model relations');
        }
    }
}

// Run the test
testDataEndpoint(); 