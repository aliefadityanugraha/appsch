/**
 * Migration untuk menambahkan kolom reset password
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('User', function(table) {
    // Tambah kolom untuk reset password
    table.string('resetToken', 255).nullable().comment('Token untuk reset password');
    table.datetime('resetTokenExpiry').nullable().comment('Waktu expired token reset password');
    table.boolean('mustResetPassword').defaultTo(false).comment('Flag apakah user harus reset password');
    
    // Ubah kolom password menjadi nullable untuk mendukung reset password
    table.string('password', 255).nullable().alter();
    
    // Tambah index untuk performa
    table.index('resetToken', 'idx_user_reset_token');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('User', function(table) {
    // Hapus kolom yang ditambahkan
    table.dropColumn('resetToken');
    table.dropColumn('resetTokenExpiry');
    table.dropColumn('mustResetPassword');
    
    // Kembalikan kolom password menjadi not null
    table.string('password', 255).notNullable().alter();
    
    // Hapus index
    table.dropIndex('resetToken', 'idx_user_reset_token');
  });
};