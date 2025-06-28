const { checkObjectionConnection } = require('../config/database');
const Records = require('../models/Records');
const Task = require('../models/Task');
const Staff = require('../models/Staff');

async function debugDataEndpoint() {
    console.log('🔍 Debugging /data endpoint...\n');

    try {
        // Check database connection
        console.log('1️⃣ Checking database connection...');
        const connectionResult = await checkObjectionConnection();
        
        if (!connectionResult.success) {
            console.error('❌ Database connection failed');
            return;
        }
        console.log('✅ Database connection successful\n');

        // Test date calculation
        console.log('2️⃣ Testing date calculation...');
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
        try {
            const allRecords = await Records.query();
            console.log(`   Total records in database: ${allRecords.length}`);
            
            if (allRecords.length > 0) {
                console.log('   Sample record:');
                console.log('     ID:', allRecords[0].id);
                console.log('     Value:', allRecords[0].value);
                console.log('     StaffId:', allRecords[0].staffId);
                console.log('     CreatedAt:', allRecords[0].createdAt);
                console.log('     UpdatedAt:', allRecords[0].updatedAt);
            }
        } catch (error) {
            console.error('❌ Error in basic Records query:', error.message);
            return;
        }

        // Test Records with date filter
        console.log('\n4️⃣ Testing Records with date filter...');
        try {
            const recordsWithDate = await Records.query()
                .whereBetween('createdAt', [startDate, endDate]);
            console.log(`   Records in current month: ${recordsWithDate.length}`);
        } catch (error) {
            console.error('❌ Error in Records date filter:', error.message);
            console.error('   This is likely the datetime format issue');
            return;
        }

        // Test Records with relations
        console.log('\n5️⃣ Testing Records with staff relation...');
        try {
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
                }
            }
        } catch (error) {
            console.error('❌ Error in Records with staff relation:', error.message);
            return;
        }

        // Test Records with tasks relation
        console.log('\n6️⃣ Testing Records with tasks relation...');
        try {
            const recordsWithTasks = await Records.query()
                .withGraphFetched('tasks');
            console.log(`   Records with tasks relation: ${recordsWithTasks.length}`);
            
            if (recordsWithTasks.length > 0) {
                console.log('   Sample record with tasks:');
                console.log('     Record ID:', recordsWithTasks[0].id);
                console.log('     Tasks count:', recordsWithTasks[0].tasks ? recordsWithTasks[0].tasks.length : 0);
            }
        } catch (error) {
            console.error('❌ Error in Records with tasks relation:', error.message);
            return;
        }

        // Test full query (like in controller)
        console.log('\n7️⃣ Testing full query (like in controller)...');
        try {
            const fullQuery = await Records.query()
                .whereBetween('createdAt', [startDate, endDate])
                .withGraphFetched('[staff(name, tunjangan, jabatan), tasks]')
                .orderBy('createdAt', 'asc');
            
            console.log(`   Full query result: ${fullQuery.length} records`);
            console.log('✅ Full query successful!');
            
            if (fullQuery.length > 0) {
                console.log('   Sample full record:');
                console.log('     ID:', fullQuery[0].id);
                console.log('     Value:', fullQuery[0].value);
                console.log('     Staff:', fullQuery[0].staff ? fullQuery[0].staff.name : 'Not found');
                console.log('     Tasks count:', fullQuery[0].tasks ? fullQuery[0].tasks.length : 0);
            }
            
        } catch (error) {
            console.error('❌ Error in full query:', error.message);
            console.error('   Stack trace:', error.stack);
            return;
        }

        // Test Staff model
        console.log('\n8️⃣ Testing Staff model...');
        try {
            const staffCount = await Staff.query().resultSize();
            console.log(`   Total staff: ${staffCount}`);
        } catch (error) {
            console.error('❌ Error in Staff query:', error.message);
        }

        // Test Task model
        console.log('\n9️⃣ Testing Task model...');
        try {
            const taskCount = await Task.query().resultSize();
            console.log(`   Total tasks: ${taskCount}`);
        } catch (error) {
            console.error('❌ Error in Task query:', error.message);
        }

        console.log('\n🎉 Data endpoint debug completed!');
        console.log('📋 Summary:');
        console.log('   - Database connection: ✅');
        console.log('   - Date calculation: ✅');
        console.log('   - Basic Records query: ✅');
        console.log('   - Records with date filter: ✅');
        console.log('   - Records with staff relation: ✅');
        console.log('   - Records with tasks relation: ✅');
        console.log('   - Full query (controller): ✅');

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the debug
debugDataEndpoint(); 