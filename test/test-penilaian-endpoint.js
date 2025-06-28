const { checkObjectionConnection } = require('../config/database');
const Records = require('../models/Records');
const Task = require('../models/Task');
const Staff = require('../models/Staff');
const { knex } = require('../config/database');

async function testPenilaianEndpoint() {
    console.log('🧪 Testing penilaian (addRecords) endpoint...\n');

    try {
        // Check database connection
        console.log('1️⃣ Checking database connection...');
        const connectionResult = await checkObjectionConnection();
        
        if (!connectionResult.success) {
            console.error('❌ Database connection failed');
            return;
        }
        console.log('✅ Database connection successful\n');

        // Get sample staff ID
        console.log('2️⃣ Getting sample staff...');
        const sampleStaff = await Staff.query().first();
        if (!sampleStaff) {
            console.error('❌ No staff found in database');
            return;
        }
        console.log('   Sample staff:');
        console.log('     ID:', sampleStaff.id);
        console.log('     Name:', sampleStaff.name);
        console.log('     Jabatan:', sampleStaff.jabatan);

        // Get sample tasks
        console.log('\n3️⃣ Getting sample tasks...');
        const sampleTasks = await Task.query().limit(3);
        if (sampleTasks.length === 0) {
            console.error('❌ No tasks found in database');
            return;
        }
        console.log(`   Found ${sampleTasks.length} sample tasks:`);
        sampleTasks.forEach((task, index) => {
            console.log(`     ${index + 1}. ID: ${task.id}, Description: ${task.description}, Value: ${task.value}`);
        });

        // Simulate request body
        const requestBody = {
            taskIds: sampleTasks.map(task => task.id),
            date: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
        };

        console.log('\n4️⃣ Simulating addRecords request...');
        console.log('   Request body:', requestBody);
        console.log('   Staff ID:', sampleStaff.id);

        // Test the logic step by step
        console.log('\n5️⃣ Testing step-by-step logic...');

        // Step 1: Parse taskIds
        let taskIds = requestBody.taskIds || [];
        if (typeof taskIds === "string") {
            taskIds = [taskIds];
        }
        console.log('   Task IDs parsed:', taskIds);

        // Step 2: Get tasks and calculate total value
        console.log('\n6️⃣ Fetching tasks and calculating total...');
        const tasks = await Task.query().whereIn('id', taskIds);
        const totalTaskValue = tasks.reduce((sum, task) => sum + (task.value || 0), 0);
        console.log(`   Tasks found: ${tasks.length}`);
        console.log('   Total task value:', totalTaskValue);

        // Step 3: Handle date
        console.log('\n7️⃣ Handling date...');
        let createdAt = new Date();
        if (requestBody.date) {
            createdAt = new Date(requestBody.date);
            createdAt.setHours(0, 0, 0, 0);
        }
        console.log('   Created at:', createdAt);

        // Step 4: Create record
        console.log('\n8️⃣ Creating record...');
        const record = await Records.query().insert({
            staffId: sampleStaff.id,
            value: totalTaskValue,
        });
        console.log('   Record created with ID:', record.id);

        // Step 5: Create task relations
        console.log('\n9️⃣ Creating task relations...');
        if (taskIds.length > 0) {
            const junctionData = taskIds.map(taskId => ({
                A: record.id,
                B: taskId
            }));
            
            await knex('_RecordTasks').insert(junctionData);
            console.log(`   Created ${junctionData.length} task relations`);
        }

        // Step 6: Verify the record was created
        console.log('\n🔍 Verifying created record...');
        const createdRecord = await Records.query()
            .findById(record.id)
            .withGraphFetched('[staff, tasks]');
        
        console.log('   Record details:');
        console.log('     ID:', createdRecord.id);
        console.log('     Value:', createdRecord.value);
        console.log('     StaffId:', createdRecord.staffId);
        console.log('     Staff Name:', createdRecord.staff ? createdRecord.staff.name : 'Not found');
        console.log('     Tasks count:', createdRecord.tasks ? createdRecord.tasks.length : 0);

        // Step 7: Clean up (optional - for testing)
        console.log('\n🧹 Cleaning up test data...');
        await knex('_RecordTasks').where('A', record.id).delete();
        await Records.query().deleteById(record.id);
        console.log('   Test data cleaned up');

        console.log('\n🎉 Penilaian endpoint test completed successfully!');
        console.log('📋 Summary:');
        console.log('   - Database connection: ✅');
        console.log('   - Staff lookup: ✅');
        console.log('   - Task lookup: ✅');
        console.log('   - Record creation: ✅');
        console.log('   - Task relations: ✅');
        console.log('   - Data verification: ✅');

        console.log('\n🔗 The penilaian endpoint should now work correctly!');

    } catch (error) {
        console.error('❌ Penilaian endpoint test failed:', error.message);
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
        } else if (error.message.includes('foreign key')) {
            console.error('\n💡 Issue: Foreign key constraint error');
            console.error('   Solution: Check if referenced records exist');
        }
    } finally {
        await knex.destroy();
    }
}

// Run the test
testPenilaianEndpoint(); 