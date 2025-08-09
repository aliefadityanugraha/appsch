const BaseModel = require('./BaseModel');
const { Model } = require('objection');

class Records extends BaseModel {
  static get tableName() {
    return 'records';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['staffId'],
      properties: {
        ...super.jsonSchema.properties,
        staffId: { 
          type: 'string', 
          format: 'uuid',
          description: 'Staff ID associated with this record'
        },
        value: { 
          type: 'number',
          minimum: 0,
          description: 'Record value'
        }
      }
    };
  }

  static get relationMappings() {
    const Staff = require('./Staff');
    const Task = require('./Task');
    const { Model } = require('objection');

    return {
      staff: {
        relation: Model.BelongsToOneRelation,
        modelClass: Staff,
        join: {
          from: 'records.staffId',
          to: 'staff.id'
        }
      },
      tasks: {
        relation: Model.ManyToManyRelation,
        modelClass: Task,
        join: {
          from: 'records.id',
          through: {
            from: '_RecordTasks.A',
            to: '_RecordTasks.B'
          },
          to: 'task.id'
        }
      }
    };
  }

  // $beforeInsert and $beforeUpdate methods are handled by BaseModel
}

module.exports = Records;