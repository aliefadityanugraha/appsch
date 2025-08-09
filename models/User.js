const BaseModel = require('./BaseModel');
const { Model } = require('objection');
const { v4: uuidv4 } = require('uuid');

class User extends BaseModel {
  static get tableName() {
    return 'user';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['email'],
      properties: {
        ...super.jsonSchema.properties,
        email: { type: 'string', format: 'email' },
        password: { type: ['string', 'null'], minLength: 1 },
        status: { type: 'boolean', default: true },
        role: { type: 'integer', default: 1 },
        refreshToken: { type: ['string', 'null'] },
        resetToken: { type: ['string', 'null'] },
        resetTokenExpiry: { type: ['string', 'null'], format: 'date-time' },
        mustResetPassword: { type: 'boolean', default: false }
      }
    };
  }
  
  static get relationMappings() {
    const Role = require('./Role');
    
    return {
      userRole: {
        relation: Model.BelongsToOneRelation,
        modelClass: Role,
        join: {
          from: 'user.role',
          to: 'role.id'
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

  // Add custom query method with logging
  static async findByEmail(email) {
    console.log('🔍 User.findByEmail called with:', email);
    try {
      const user = await this.query().where('email', email).first();
      console.log('🔍 User.findByEmail result:', user ? 'Found' : 'Not found');
      if (user) {
        console.log('   User details:', {
          id: user.id,
          email: user.email,
          status: user.status,
          role: user.role,
          hasPassword: !!user.password
        });
      }
      return user;
    } catch (error) {
      console.error('❌ User.findByEmail error:', error.message);
      throw error;
    }
  }

  // Add custom update method with logging
  static async updateRefreshToken(id, refreshToken) {
    console.log('💾 User.updateRefreshToken called:', { id, hasRefreshToken: !!refreshToken });
    try {
      // Use MySQL compatible datetime format
      const now = new Date();
      const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
      
      const result = await this.query().findById(id).patch({ 
        refreshToken,
        updatedAt: mysqlDateTime
      });
      console.log('💾 User.updateRefreshToken result:', result);
      return result;
    } catch (error) {
      console.error('❌ User.updateRefreshToken error:', error.message);
      throw error;
    }
  }
}

module.exports = User;