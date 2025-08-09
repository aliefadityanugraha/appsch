const BaseModel = require('./BaseModel');

class Task extends BaseModel {
  static get tableName() {
    return 'task';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['staffId', 'periodeId', 'description', 'value'],
      properties: {
        ...super.jsonSchema.properties,
        staffId: { type: 'string', format: 'uuid' },
        periodeId: { type: 'string', format: 'uuid' },
        description: { type: 'string', minLength: 1, maxLength: 191 },
        value: { type: 'integer', minimum: 0 }
      }
    };
  }

  static get relationMappings() {
    const Staff = require('./Staff');
    const Periode = require('./Periode');
    const Records = require('./Records');
    const { Model } = require('objection');

    return {
      staff: {
        relation: Model.BelongsToOneRelation,
        modelClass: Staff,
        join: {
          from: 'task.staffId',
          to: 'staff.id'
        }
      },
      periode: {
        relation: Model.BelongsToOneRelation,
        modelClass: Periode,
        join: {
          from: 'task.periodeId',
          to: 'periode.id'
        }
      },
      records: {
        relation: Model.ManyToManyRelation,
        modelClass: Records,
        join: {
          from: 'task.id',
          through: {
            from: '_RecordTasks.B',
            to: '_RecordTasks.A'
          },
          to: 'records.id'
        }
      }
    };
  }

  // $beforeInsert and $beforeUpdate are handled by BaseModel
}

module.exports = Task;