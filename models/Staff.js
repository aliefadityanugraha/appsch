const { Model } = require('objection');

class Staff extends Model {
  static get tableName() {
    return 'Staff';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'jabatan', 'nip', 'tunjangan'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', minLength: 1 },
        jabatan: { type: 'string', minLength: 1 },
        nip: { type: 'string', minLength: 1 },
        tunjangan: { type: 'string', minLength: 1 },
        date: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Task = require('./Task');
    const Records = require('./Records');

    return {
      task: {
        relation: Model.HasManyRelation,
        modelClass: Task,
        join: {
          from: 'Staff.id',
          to: 'Task.staffId'
        }
      },
      records: {
        relation: Model.HasManyRelation,
        modelClass: Records,
        join: {
          from: 'Staff.id',
          to: 'Records.staffId'
        }
      }
    };
  }

  $beforeInsert() {
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updatedAt = new Date().toISOString();
  }
}

module.exports = Staff; 