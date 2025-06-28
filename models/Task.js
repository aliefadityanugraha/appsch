const { Model } = require('objection');
const { v4: uuidv4 } = require('uuid');

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
            from: '_RecordTasks.B',
            to: '_RecordTasks.A'
          },
          to: 'Records.id'
        }
      }
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

module.exports = Task;