const { knex } = require('../config/database');

async function addSampleRecordTasks() {
  try {
    console.log('📝 Adding sample data to _RecordTasks table...\n');

    // Check if table exists
    const tableExists = await knex.schema.hasTable('_RecordTasks');
    if (!tableExists) {
      console.log('❌ Table _RecordTasks does not exist!');
      console.log('   Please run create-recordtasks-table.js first.');
      return;
    }

    // Get existing Records and Tasks
    console.log('1️⃣ Getting existing Records and Tasks...');
    const records = await knex('Records').select('id').limit(10);
    const tasks = await knex('Task').select('id').limit(10);
    
    console.log(`   Found ${records.length} Records`);
    console.log(`   Found ${tasks.length} Tasks\n`);

    if (records.length === 0 || tasks.length === 0) {
      console.log('❌ No Records or Tasks found!');
      console.log('   Please add some Records and Tasks first.');
      return;
    }

    // Check existing relationships
    console.log('2️⃣ Checking existing relationships...');
    const existingCount = await knex('_RecordTasks').count('* as total');
    console.log(`   Existing relationships: ${existingCount[0].total}\n`);

    if (existingCount[0].total > 0) {
      console.log('ℹ️  Relationships already exist. Showing sample:');
      const sampleRelations = await knex('_RecordTasks').limit(5);
      sampleRelations.forEach((rel, index) => {
        console.log(`   ${index + 1}. Record: ${rel.A}, Task: ${rel.B}`);
      });
      console.log();
    }

    // Add sample relationships
    console.log('3️⃣ Adding sample relationships...');
    const sampleRelationships = [];
    
    // Create some sample relationships
    for (let i = 0; i < Math.min(records.length, tasks.length); i++) {
      sampleRelationships.push({
        A: records[i].id,
        B: tasks[i].id
      });
    }

    // Add a few more random relationships
    if (records.length > 1 && tasks.length > 1) {
      sampleRelationships.push({
        A: records[0].id,
        B: tasks[1].id
      });
      sampleRelationships.push({
        A: records[1].id,
        B: tasks[0].id
      });
    }

    try {
      await knex('_RecordTasks').insert(sampleRelationships);
      console.log(`✅ Added ${sampleRelationships.length} sample relationships!\n`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  Some relationships already exist (duplicate key error).');
        console.log('   This is normal if relationships were already added.\n');
      } else {
        throw error;
      }
    }

    // Verify the relationships
    console.log('4️⃣ Verifying relationships...');
    const finalCount = await knex('_RecordTasks').count('* as total');
    console.log(`   Total relationships: ${finalCount[0].total}`);

    // Test the relation query
    console.log('\n5️⃣ Testing relation query...');
    try {
      const testQuery = await knex('Records')
        .select('Records.id', 'Records.value', 'Task.id as taskId', 'Task.description')
        .join('_RecordTasks', 'Records.id', '_RecordTasks.A')
        .join('Task', '_RecordTasks.B', 'Task.id')
        .limit(3);

      console.log('   ✅ Relation query successful!');
      console.log('   Sample results:');
      testQuery.forEach((result, index) => {
        console.log(`   ${index + 1}. Record ${result.id} (value: ${result.value}) -> Task ${result.taskId} (${result.description})`);
      });
    } catch (error) {
      console.log('   ❌ Relation query failed:');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n🎉 Sample data setup complete!');
    console.log('   You can now test the /data endpoint.');

  } catch (error) {
    console.error('❌ Error adding sample data:');
    console.error(error);
  } finally {
    await knex.destroy();
  }
}

addSampleRecordTasks(); 