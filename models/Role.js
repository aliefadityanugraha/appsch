const BaseModel = require('./BaseModel');
const { Model } = require('objection');
const { v4: uuidv4 } = require('uuid');

class Role extends BaseModel {
  static get tableName() {
    return 'role';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['role', 'permission', 'description'],
      properties: {
        ...super.jsonSchema.properties,
        role: { type: 'string', minLength: 1 },
        roleId: { type: 'integer' },
        permission: { type: 'string' },
        description: { type: 'string', minLength: 1 }
      }
    };
  }

  static get relationMappings() {
    const User = require('./User');
    
    return {
      users: {
        relation: Model.HasManyRelation,
        modelClass: User,
        join: {
          from: 'role.id',
          to: 'user.role'
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

module.exports = Role;