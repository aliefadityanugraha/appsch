const { Model } = require('objection');
const { v4: uuidv4 } = require('uuid');

class Settings extends Model {
  static get tableName() {
    return 'Settings';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['tunjangan', 'color'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        tunjangan: { type: 'string', minLength: 1 },
        color: { type: 'string', minLength: 1 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      // Add relations here if needed
    };
  }

  $beforeInsert() {
    this.id = this.id || uuidv4();
    if (this.createdAt && this.createdAt instanceof Date) {
      this.createdAt = this.createdAt.toISOString().slice(0, 19).replace('T', ' ');
    } else if (!this.createdAt) {
      const now = new Date();
      this.createdAt = now.toISOString().slice(0, 19).replace('T', ' ');
    }
    const now = new Date();
    this.updatedAt = now.toISOString().slice(0, 19).replace('T', ' ');
  }

  $beforeUpdate() {
    if (this.updatedAt && this.updatedAt instanceof Date) {
      this.updatedAt = this.updatedAt.toISOString().slice(0, 19).replace('T', ' ');
    } else {
      const now = new Date();
      this.updatedAt = now.toISOString().slice(0, 19).replace('T', ' ');
    }
  }
}

module.exports = Settings;