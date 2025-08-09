const BaseModel = require('./BaseModel');
const { Model } = require('objection');

class Periode extends BaseModel {
  static get tableName() {
    return 'periode';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['periode', 'nilai'],
      properties: {
        ...super.jsonSchema.properties,
        periode: { type: 'string', minLength: 1, maxLength: 191 },
        nilai: { type: 'integer', minimum: 0 }
      }
    };
  }

  static get relationMappings() {
    const Task = require('./Task');
    const { Model } = require('objection');

    return {
      tasks: {
        relation: Model.HasManyRelation,
        modelClass: Task,
        join: {
          from: 'periode.id',
          to: 'task.periodeId'
        }
      }
    };
  }


}

module.exports = Periode;