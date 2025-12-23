/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add indexes for better query performance
  await knex.schema.table('task', function(table) {
    table.index('staffId', 'idx_task_staffid');
    table.index('periodeid', 'idx_task_periodeid');
    table.index(['staffId', 'periodeid'], 'idx_task_staff_periode');
    table.index('createdAt', 'idx_task_created');
  });

  await knex.schema.table('records', function(table) {
    table.index('staffId', 'idx_records_staffid');
    table.index('createdAt', 'idx_records_created');
    table.index(['staffId', 'createdAt'], 'idx_records_staff_date');
  });

  await knex.schema.table('staff', function(table) {
    table.index('nip', 'idx_staff_nip');
    table.index('jabatan', 'idx_staff_jabatan');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('task', function(table) {
    table.dropIndex('staffId', 'idx_task_staffid');
    table.dropIndex('periodeid', 'idx_task_periodeid');
    table.dropIndex(['staffId', 'periodeid'], 'idx_task_staff_periode');
    table.dropIndex('createdAt', 'idx_task_created');
  });

  await knex.schema.table('records', function(table) {
    table.dropIndex('staffId', 'idx_records_staffid');
    table.dropIndex('createdAt', 'idx_records_created');
    table.dropIndex(['staffId', 'createdAt'], 'idx_records_staff_date');
  });

  await knex.schema.table('staff', function(table) {
    table.dropIndex('nip', 'idx_staff_nip');
    table.dropIndex('jabatan', 'idx_staff_jabatan');
  });
};
