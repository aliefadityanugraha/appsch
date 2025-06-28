const { Model } = require('objection');
const { v4: uuidv4 } = require('uuid');

class Records extends Model {
  static get tableName() {
    return 'Records';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['value', 'staffId'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        value: { type: 'number' },
        staffId: { type: 'string', format: 'uuid' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const Staff = require('./Staff');
    const Task = require('./Task');

    return {
      staff: {
        relation: Model.BelongsToOneRelation,
        modelClass: Staff,
        join: {
          from: 'Records.staffId',
          to: 'Staff.id'
        }
      },
      tasks: {
        relation: Model.ManyToManyRelation,
        modelClass: Task,
        join: {
          from: 'Records.id',
          through: {
            from: '_RecordTasks.A',
            to: '_RecordTasks.B'
          },
          to: 'Task.id'
        }
      }
    };
  }

  $beforeInsert() {
    console.log('🔧 Records.$beforeInsert called...');
    console.log('   Original data:', this);
    
    this.id = this.id || uuidv4();
    if (this.createdAt && this.createdAt instanceof Date) {
      this.createdAt = this.createdAt.toISOString().slice(0, 19).replace('T', ' ');
    } else if (!this.createdAt) {
      const now = new Date();
      this.createdAt = now.toISOString().slice(0, 19).replace('T', ' ');
    }
    const now = new Date();
    this.updatedAt = now.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('   Generated ID:', this.id);
    console.log('   Set createdAt:', this.createdAt);
    console.log('   Set updatedAt:', this.updatedAt);
    console.log('   Final data:', this);
  }

  $beforeUpdate() {
    console.log('🔧 Records.$beforeUpdate called...');
    console.log('   Original data:', this);
    
    if (this.updatedAt && this.updatedAt instanceof Date) {
      this.updatedAt = this.updatedAt.toISOString().slice(0, 19).replace('T', ' ');
    } else {
      const now = new Date();
      this.updatedAt = now.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    console.log('   Updated updatedAt:', this.updatedAt);
    console.log('   Final data:', this);
  }
}

module.exports = Records;