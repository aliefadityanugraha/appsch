const { knex } = require('../config/database');

async function createRecordTasksTable() {
  try {
    console.log('🔧 Creating _RecordTasks table if it doesn\'t exist...\n');

    // Check if table exists
    const tableExists = await knex.schema.hasTable('_RecordTasks');
    
    if (tableExists) {
      console.log('✅ Table _RecordTasks already exists!');
      return;
    }

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

    console.log('✅ Table _RecordTasks created successfully!');

    // Add foreign key constraints
    console.log('🔗 Adding foreign key constraints...');
    
    try {
      await knex.raw(`
        ALTER TABLE _RecordTasks 
        ADD CONSTRAINT _RecordTasks_A_fkey 
        FOREIGN KEY (A) REFERENCES Records(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      
      await knex.raw(`
        ALTER TABLE _RecordTasks 
        ADD CONSTRAINT _RecordTasks_B_fkey 
        FOREIGN KEY (B) REFERENCES Task(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
      
      console.log('✅ Foreign key constraints added successfully!');
    } catch (error) {
      console.log('⚠️  Warning: Could not add foreign key constraints:');
      console.log(`   ${error.message}`);
      console.log('   This might be due to existing data or table structure.');
    }

    // Check if we need to migrate existing data
    console.log('\n📊 Checking for existing data to migrate...');
    
    // Check if Task table has recordId column (old structure)
    const taskColumns = await knex.raw('DESCRIBE Task');
    const hasRecordId = taskColumns[0].some(col => col.Field === 'recordId');
    
    if (hasRecordId) {
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
    } else {
      console.log('ℹ️  No old structure found. Table is ready for new data.');
    }

    console.log('\n🎉 _RecordTasks table setup complete!');
    console.log('   You can now test the /data endpoint.');

  } catch (error) {
    console.error('❌ Error creating _RecordTasks table:');
    console.error(error);
  } finally {
    await knex.destroy();
  }
}

createRecordTasksTable(); 