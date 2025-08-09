"use strict";

const BaseRepository = require('./BaseRepository');
const Staff = require('../models/Staff');

class StaffRepository extends BaseRepository {
    constructor() {
        super(Staff);
    }

    async findAllWithRelations() {
        return this.findAll({
            relations: '[task.[periode], records]',
            orderBy: { column: 'createdAt', direction: 'asc' }
        });
    }

    async findByIdWithTasks(id) {
        return this.findById(id, '[task.[periode], records]');
    }

    async findByNip(nip) {
        return this.findOne({ nip });
    }

    async findStaffWithTasksInPeriode(staffId, periodeId) {
        return this.model.query()
            .findById(staffId)
            .withGraphFetched('task')
            .modifyGraph('task', builder => {
                builder.where('periodeId', periodeId);
            });
    }

    async getStaffPerformanceData(staffId, startDate, endDate) {
        return this.model.query()
            .findById(staffId)
            .withGraphFetched('records')
            .modifyGraph('records', builder => {
                builder.whereBetween('createdAt', [startDate, endDate]);
            });
    }

    async searchStaff(searchTerm) {
        return this.model.query()
            .where('name', 'like', `%${searchTerm}%`)
            .orWhere('nip', 'like', `%${searchTerm}%`)
            .orWhere('jabatan', 'like', `%${searchTerm}%`);
    }

    async getStaffStatistics() {
        const [totalStaff, staffByJabatan] = await Promise.all([
            this.count(),
            this.model.query()
                .select('jabatan')
                .count('* as count')
                .groupBy('jabatan')
        ]);

        return {
            total: totalStaff,
            byJabatan: staffByJabatan
        };
    }

    async validateUniqueNip(nip, excludeId = null) {
        let query = this.model.query().where('nip', nip);
        
        if (excludeId) {
            query = query.whereNot('id', excludeId);
        }
        
        const existing = await query.first();
        return !existing;
    }
}

module.exports = StaffRepository;