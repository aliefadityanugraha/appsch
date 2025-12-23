/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Drop table if exists first
  await knex.schema.dropTableIfExists('_RecordTasks');
  
  // Create table with proper structure (without foreign keys for now)
  return knex.schema.createTable('_RecordTasks', function(table) {
    table.string('A', 191).notNullable(); // Record ID (UUID as VARCHAR)
    table.string('B', 191).notNullable(); // Task ID (UUID as VARCHAR)
    
    // Create composite primary key
    table.primary(['A', 'B']);
    
    // Indexes for better performance
    table.index('A');
    table.index('B');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('_RecordTasks');
};
