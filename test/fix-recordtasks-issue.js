const { knex } = require('../config/database');

async function fixRecordTasksIssue() {
  try {
    console.log('🔧 Fixing _RecordTasks table issue...\n');

    // Step 1: Check if table exists
    console.log('1️⃣ Checking if _RecordTasks table exists...');
    const tableExists = await knex.schema.hasTable('_RecordTasks');
    console.log(`   Table exists: ${tableExists ? '✅ Yes' : '❌ No'}\n`);

    if (!tableExists) {
      console.log('📋 Creating _RecordTasks table...');
      
      // Create the table based on Prisma migration
      await knex.schema.createTable('_RecordTasks', (table) => {
        table.string('A', 191).notNullable();
        table.string('B', 191).notNullable();
        
        // Add unique constraint
        table.unique(['A', 'B'], '_RecordTasks_AB_unique');
        
        // Add index on B column
        table.index(['B'], '_RecordTasks_B_index');
      });

      console.log('✅ Table _RecordTasks created successfully!\n');
    }

    // Step 2: Check table structure
    console.log('2️⃣ Checking table structure...');
    const columns = await knex.raw('DESCRIBE _RecordTasks');
    console.log('   Columns:');
    columns[0].forEach(col => {
      console.log(`     - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    console.log();

    // Step 3: Check existing data
    console.log('3️⃣ Checking existing data...');
    const dataCount = await knex('_RecordTasks').count('* as total');
    console.log(`   Total relationships: ${dataCount[0].total}`);

    if (dataCount[0].total > 0) {
      console.log('   Sample relationships:');
      const sampleData = await knex('_RecordTasks').limit(3);
      sampleData.forEach((record, index) => {
        console.log(`     ${index + 1}. A: ${record.A}, B: ${record.B}`);
      });
    }
    console.log();

    // Step 4: Check if we need to migrate existing data
    console.log('4️⃣ Checking for data migration...');
    
    // Check if Task table has recordId column (old structure)
    const taskColumns = await knex.raw('DESCRIBE Task');
    const hasRecordId = taskColumns[0].some(col => col.Field === 'recordId');
    
    if (hasRecordId && dataCount[0].total === 0) {
      console.log('🔄 Found old structure with recordId in Task table.');
      console.log('   Migrating existing relationships...');
      
      try {
        // Get existing relationships
        const existingRelations = await knex('Task')
          .select('id as taskId', 'recordId')
          .whereNotNull('recordId');
        
        if (existingRelations.length > 0) {
          // Insert into junction table
          const junctionData = existingRelations.map(rel => ({
            A: rel.recordId,
            B: rel.taskId
          }));
          
          await knex('_RecordTasks').insert(junctionData);
          console.log(`✅ Migrated ${existingRelations.length} relationships to _RecordTasks table.`);
        } else {
          console.log('ℹ️  No existing relationships found to migrate.');
        }
      } catch (error) {
        console.log('⚠️  Warning: Could not migrate existing data:');
        console.log(`   ${error.message}`);
      }
    } else if (!hasRecordId && dataCount[0].total === 0) {
      console.log('📝 No existing data found. Adding sample relationships...');
      
      // Get existing Records and Tasks
      const records = await knex('Records').select('id').limit(5);
      const tasks = await knex('Task').select('id').limit(5);
      
      if (records.length > 0 && tasks.length > 0) {
        const sampleRelationships = [];
        
        // Create some sample relationships
        for (let i = 0; i < Math.min(records.length, tasks.length); i++) {
          sampleRelationships.push({
            A: records[i].id,
            B: tasks[i].id
          });
        }

        try {
          await knex('_RecordTasks').insert(sampleRelationships);
          console.log(`✅ Added ${sampleRelationships.length} sample relationships!`);
        } catch (error) {
          console.log('⚠️  Warning: Could not add sample data:');
          console.log(`   ${error.message}`);
        }
      } else {
        console.log('ℹ️  No Records or Tasks found to create relationships.');
      }
    }
    console.log();

    // Step 5: Test the relation query
    console.log('5️⃣ Testing relation query...');
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

    console.log('\n🎉 _RecordTasks table issue fixed!');
    console.log('   You can now test the /data endpoint.');

  } catch (error) {
    console.error('❌ Error fixing _RecordTasks table issue:');
    console.error(error);
  } finally {
    await knex.destroy();
  }
}

fixRecordTasksIssue(); 