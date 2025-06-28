const { checkObjectionConnection } = require('../config/database');
const Records = require('../models/Records');
const Task = require('../models/Task');
const Staff = require('../models/Staff');
const { knex } = require('../config/database');

async function debugAddRecord() {
    console.log('🔍 Debugging add record functionality...\n');

    try {
        // Check database connection
        console.log('1️⃣ Checking database connection...');
        const connectionResult = await checkObjectionConnection();
        
        if (!connectionResult.success) {
            console.error('❌ Database connection failed');
            return;
        }
        console.log('✅ Database connection successful\n');

        // Check current records count
        console.log('2️⃣ Checking current records...');
        const currentRecords = await Records.query();
        console.log(`   Current records count: ${currentRecords.length}`);

        // Get sample staff
        console.log('\n3️⃣ Getting sample staff...');
        const sampleStaff = await Staff.query().first();
        if (!sampleStaff) {
            console.error('❌ No staff found in database');
            return;
        }
        console.log('   Sample staff:');
        console.log('     ID:', sampleStaff.id);
        console.log('     Name:', sampleStaff.name);
        console.log('     Jabatan:', sampleStaff.jabatan);

        // Get sample tasks for this staff
        console.log('\n4️⃣ Getting tasks for this staff...');
        const staffTasks = await Task.query().where('staffId', sampleStaff.id);
        console.log(`   Found ${staffTasks.length} tasks for staff ${sampleStaff.name}`);
        
        if (staffTasks.length === 0) {
            console.log('   ⚠️ No tasks found for this staff');
            console.log('   Getting any available tasks...');
            const anyTasks = await Task.query().limit(3);
            console.log(`   Found ${anyTasks.length} tasks in total`);
            if (anyTasks.length > 0) {
                console.log('   Sample tasks:');
                anyTasks.forEach((task, index) => {
                    console.log(`     ${index + 1}. ID: ${task.id}, Description: ${task.description}, Value: ${task.value}`);
                });
            }
        } else {
            console.log('   Sample tasks:');
            staffTasks.slice(0, 3).forEach((task, index) => {
                console.log(`     ${index + 1}. ID: ${task.id}, Description: ${task.description}, Value: ${task.value}`);
            });
        }

        // Simulate form submission
        console.log('\n5️⃣ Simulating form submission...');
        const taskIds = staffTasks.length > 0 ? 
            staffTasks.slice(0, 2).map(task => task.id) : 
            ['01a2a3ca-0927-42b1-934c-d8bb9f219fda']; // Use a known task ID
        
        const formData = {
            taskIds: taskIds,
            date: new Date().toISOString().split('T')[0]
        };
        
        console.log('   Form data:');
        console.log('     Staff ID:', sampleStaff.id);
        console.log('     Task IDs:', formData.taskIds);
        console.log('     Date:', formData.date);

        // Test step by step
        console.log('\n6️⃣ Testing step by step...');

        // Step 1: Parse taskIds
        let parsedTaskIds = formData.taskIds || [];
        if (typeof parsedTaskIds === "string") {
            parsedTaskIds = [parsedTaskIds];
        }
        console.log('   Parsed task IDs:', parsedTaskIds);

        // Step 2: Validate taskIds
        console.log('\n7️⃣ Validating task IDs...');
        const validTasks = await Task.query().whereIn('id', parsedTaskIds);
        console.log(`   Valid tasks found: ${validTasks.length}`);
        
        if (validTasks.length === 0) {
            console.error('❌ No valid tasks found!');
            console.log('   Available task IDs:');
            const allTasks = await Task.query().select('id').limit(5);
            allTasks.forEach(task => console.log(`     - ${task.id}`));
            return;
        }

        // Step 3: Calculate total value
        console.log('\n8️⃣ Calculating total value...');
        const totalValue = validTasks.reduce((sum, task) => sum + (task.value || 0), 0);
        console.log('   Total value:', totalValue);

        // Step 4: Create record
        console.log('\n9️⃣ Creating record...');
        try {
            const newRecord = await Records.query().insert({
                staffId: sampleStaff.id,
                value: totalValue
            });
            console.log('   ✅ Record created successfully!');
            console.log('   Record ID:', newRecord.id);
            console.log('   Record value:', newRecord.value);
            console.log('   Record staffId:', newRecord.staffId);
            console.log('   Record createdAt:', newRecord.createdAt);

            // Step 5: Create task relations
            console.log('\n🔟 Creating task relations...');
            if (parsedTaskIds.length > 0) {
                const junctionData = parsedTaskIds.map(taskId => ({
                    A: newRecord.id,
                    B: taskId
                }));
                
                await knex('_RecordTasks').insert(junctionData);
                console.log(`   ✅ Created ${junctionData.length} task relations`);
            }

            // Step 6: Verify the record
            console.log('\n🔍 Verifying created record...');
            const verifiedRecord = await Records.query()
                .findById(newRecord.id)
                .withGraphFetched('[staff, tasks]');
            
            console.log('   Verification result:');
            console.log('     Record ID:', verifiedRecord.id);
            console.log('     Value:', verifiedRecord.value);
            console.log('     Staff:', verifiedRecord.staff ? verifiedRecord.staff.name : 'Not found');
            console.log('     Tasks count:', verifiedRecord.tasks ? verifiedRecord.tasks.length : 0);

            // Step 7: Clean up (optional)
            console.log('\n🧹 Cleaning up test data...');
            await knex('_RecordTasks').where('A', newRecord.id).delete();
            await Records.query().deleteById(newRecord.id);
            console.log('   Test data cleaned up');

            console.log('\n🎉 Add record functionality is working correctly!');

        } catch (error) {
            console.error('❌ Error creating record:');
            console.error('   Error message:', error.message);
            console.error('   Error code:', error.code);
            console.error('   Error sql:', error.sql);
            
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                console.error('   💡 Issue: Foreign key constraint failed');
                console.error('   Solution: Check if staff ID and task IDs exist');
            } else if (error.code === 'ER_DUP_ENTRY') {
                console.error('   💡 Issue: Duplicate entry');
                console.error('   Solution: Check for unique constraints');
            }
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        await knex.destroy();
    }
}

debugAddRecord(); 