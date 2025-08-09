const { Model } = require('objection');
const { v4: uuidv4 } = require('uuid');

class BaseModel extends Model {
    static get idColumn() {
        return 'id';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
            }
        };
    }

    $beforeInsert() {
        // Generate UUID if not provided
        if (!this.id) {
            this.id = uuidv4();
        }
        // Use MySQL compatible datetime format
        const now = new Date();
        this.createdAt = now.toISOString().slice(0, 19).replace('T', ' ');
        this.updatedAt = now.toISOString().slice(0, 19).replace('T', ' ');
    }

    $beforeUpdate() {
        // Use MySQL compatible datetime format
        const now = new Date();
        this.updatedAt = now.toISOString().slice(0, 19).replace('T', ' ');
    }

    // Handle JSON fields parsing from database
    $parseDatabaseJson(json) {
        json = super.$parseDatabaseJson(json);
        
        // Parse JSON fields if they are strings
        if (json.permission && typeof json.permission === 'string') {
            try {
                json.permission = JSON.parse(json.permission);
            } catch (e) {
                console.warn('Failed to parse permission JSON:', e);
            }
        }
        
        return json;
    }

    // Handle JSON fields formatting for database
    $formatDatabaseJson(json) {
        json = super.$formatDatabaseJson(json);
        
        // Stringify JSON fields if they are objects
        if (json.permission && typeof json.permission === 'object') {
            json.permission = JSON.stringify(json.permission);
        }
        
        return json;
    }
}

module.exports = BaseModel;