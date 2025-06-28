const { Model } = require('objection');

class Task extends Model {
  static get tableName() {
    return 'Task';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['description', 'value', 'staffId', 'periodeId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        description: { type: 'string', minLength: 1 },
        value: { type: 'number' },
        staffId: { type: 'string', format: 'uuid' },
        periodeId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Staff = require('./Staff');
    const Periode = require('./Periode');
    const Records = require('./Records');

    return {
      staff: {
        relation: Model.BelongsToOneRelation,
        modelClass: Staff,
        join: {
          from: 'Task.staffId',
          to: 'Staff.id'
        }
      },
      periode: {
        relation: Model.BelongsToOneRelation,
        modelClass: Periode,
        join: {
          from: 'Task.periodeId',
          to: 'Periode.id'
        }
      },
      records: {
        relation: Model.ManyToManyRelation,
        modelClass: Records,
        join: {
          from: 'Task.id',
          through: {
            from: 'RecordTasks.taskId',
            to: 'RecordTasks.recordId'
          },
          to: 'Records.id'
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

module.exports = Task; 