const BaseModel = require('./BaseModel');
const { Model } = require('objection');

class Staff extends BaseModel {
  static get tableName() {
    return 'staff';
  }

  static get jsonSchema() {
    const baseSchema = super.jsonSchema;
    return {
      ...baseSchema,
      required: ['name', 'jabatan', 'nip', 'tunjangan'],
      properties: {
        ...baseSchema.properties,
        name: { type: 'string', minLength: 1, maxLength: 100 },
        jabatan: { type: 'string', minLength: 1, maxLength: 50 },
        nip: { type: 'string', minLength: 8, maxLength: 20, pattern: '^[0-9]+$' },
        tunjangan: { type: 'string', minLength: 1, maxLength: 100 },
        date: { type: 'string', format: 'date-time' }
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
          from: 'staff.id',
          to: 'task.staffId'
        }
      },
      records: {
        relation: Model.HasManyRelation,
        modelClass: Records,
        join: {
          from: 'staff.id',
          to: 'records.staffId'
        }
      }
    };
  }

  // BaseModel handles $beforeInsert and $beforeUpdate
}

module.exports = Staff;