"use strict";

class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async findAll(options = {}) {
        let query = this.model.query();
        
        if (options.relations) {
            query = query.withGraphFetched(options.relations);
        }
        
        if (options.orderBy) {
            query = query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
        }
        
        if (options.limit) {
            query = query.limit(options.limit);
        }
        
        if (options.offset) {
            query = query.offset(options.offset);
        }
        
        return query;
    }

    async findById(id, relations = null) {
        let query = this.model.query().findById(id);
        
        if (relations) {
            query = query.withGraphFetched(relations);
        }
        
        return query;
    }

    async findOne(criteria, relations = null) {
        let query = this.model.query().where(criteria).first();
        
        if (relations) {
            query = query.withGraphFetched(relations);
        }
        
        return query;
    }

    async findWhere(criteria, options = {}) {
        let query = this.model.query().where(criteria);
        
        if (options.relations) {
            query = query.withGraphFetched(options.relations);
        }
        
        if (options.orderBy) {
            query = query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
        }
        
        return query;
    }

    async create(data) {
        return this.model.query().insert(data);
    }

    async update(id, data) {
        return this.model.query().patchAndFetchById(id, data);
    }

    async delete(id) {
        return this.model.query().deleteById(id);
    }

    async count(criteria = {}) {
        const result = await this.model.query()
            .where(criteria)
            .count('* as count')
            .first();
        return parseInt(result.count);
    }

    async exists(criteria) {
        const count = await this.count(criteria);
        return count > 0;
    }

    async paginate(page = 1, limit = 10, criteria = {}, options = {}) {
        const offset = (page - 1) * limit;
        
        let query = this.model.query().where(criteria);
        
        if (options.relations) {
            query = query.withGraphFetched(options.relations);
        }
        
        if (options.orderBy) {
            query = query.orderBy(options.orderBy.column, options.orderBy.direction || 'asc');
        }
        
        const [data, total] = await Promise.all([
            query.clone().limit(limit).offset(offset),
            this.count(criteria)
        ]);
        
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };
    }
}

module.exports = BaseRepository;