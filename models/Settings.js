const BaseModel = require('./BaseModel');

class Settings extends BaseModel {
  static get tableName() {
    return 'settings';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['tunjangan', 'color'],
      properties: {
        ...super.jsonSchema.properties,
        tunjangan: { type: 'string', minLength: 1 },
        color: { type: 'string', minLength: 1 }
      }
    };
  }

  static get relationMappings() {
    return {
      // Add relations here if needed
    };
  }

  // BaseModel handles $beforeInsert and $beforeUpdate
}

module.exports = Settings;