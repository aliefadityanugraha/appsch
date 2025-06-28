const { knex } = require('../config/database');
const Records = require('../models/Records');

async function deleteAllRecords() {
  try {
    console.log('🗑️ Deleting all data from _RecordTasks...');
    await knex('_RecordTasks').del();
    console.log('✅ All data from _RecordTasks deleted!');

    console.log('🗑️ Deleting all data from Records...');
    await Records.query().delete();
    console.log('✅ All data from Records deleted!');

    // Optionally, reset auto-increment if you use integer PK (not needed for UUID)
    // await knex.raw('ALTER TABLE Records AUTO_INCREMENT = 1');

    console.log('\n🎉 All records and their relations have been deleted!');
  } catch (error) {
    console.error('❌ Error deleting records:', error.message);
    console.error(error);
  } finally {
    await knex.destroy();
  }
}

deleteAllRecords(); 