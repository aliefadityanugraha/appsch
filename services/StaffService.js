"use strict";

const StaffRepository = require('../repositories/StaffRepository');
const ValidationService = require('./ValidationService');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

class StaffService {
    constructor() {
        this.staffRepository = new StaffRepository();
    }

    async getAllStaff() {
        try {
            return await this.staffRepository.findAllWithRelations();
        } catch (error) {
            throw new Error(`Failed to fetch staff: ${error.message}`);
        }
    }

    async getStaffById(id) {
        ValidationService.validateUUID(id, 'Staff ID');
        
        const staff = await this.staffRepository.findByIdWithTasks(id);
        if (!staff) {
            throw new NotFoundError('Staff not found');
        }
        
        return staff;
    }

    async createStaff(staffData) {
        // Sanitize first to avoid validation failures from minor formatting (spaces, hyphens)
        const sanitizedData = this._sanitizeStaffData(staffData);

        // Validate input data
        ValidationService.validateStaffData(sanitizedData);
        
        // Check if NIP is unique (use sanitized value)
        const isNipUnique = await this.staffRepository.validateUniqueNip(sanitizedData.nip);
        if (!isNipUnique) {
            throw new ValidationError('NIP already exists', 'nip');
        }
        
        try {
            return await this.staffRepository.create(sanitizedData);
        } catch (error) {
            throw new Error(`Failed to create staff: ${error.message}`);
        }
    }

    async updateStaff(id, staffData) {
        ValidationService.validateUUID(id, 'Staff ID');

        // Sanitize first
        const sanitizedData = this._sanitizeStaffData(staffData);

        // Validate (partial updates allowed)
        ValidationService.validateStaffData(sanitizedData, false);
        
        // Check if staff exists
        const existingStaff = await this.staffRepository.findById(id);
        if (!existingStaff) {
            throw new NotFoundError('Staff not found');
        }
        
        // Check NIP uniqueness if NIP is being updated
        if (sanitizedData.nip && sanitizedData.nip !== existingStaff.nip) {
            const isNipUnique = await this.staffRepository.validateUniqueNip(sanitizedData.nip, id);
            if (!isNipUnique) {
                throw new ValidationError('NIP already exists', 'nip');
            }
        }
        
        try {
            return await this.staffRepository.update(id, sanitizedData);
        } catch (error) {
            throw new Error(`Failed to update staff: ${error.message}`);
        }
    }

    async deleteStaff(id) {
        ValidationService.validateUUID(id, 'Staff ID');
        
        // Check if staff exists
        const existingStaff = await this.staffRepository.findById(id);
        if (!existingStaff) {
            throw new NotFoundError('Staff tidak ditemukan');
        }
        
        try {
            // Import repositories for deleting related data
            const TaskRepository = require('../repositories/TaskRepository');
            const RecordsRepository = require('../repositories/RecordsRepository');
            const taskRepository = new TaskRepository();
            const recordsRepository = new RecordsRepository();
            
            // Delete all related records first
            await recordsRepository.deleteByStaffId(id);
            
            // Delete all related tasks
            await taskRepository.deleteByStaffId(id);
            
            // Finally delete the staff
            return await this.staffRepository.delete(id);
        } catch (error) {
            throw new Error(`Gagal menghapus staff: ${error.message}`);
        }
    }

    async searchStaff(searchTerm) {
        if (!searchTerm || searchTerm.trim().length < 2) {
            throw new ValidationError('Search term must be at least 2 characters');
        }
        
        try {
            return await this.staffRepository.searchStaff(searchTerm.trim());
        } catch (error) {
            throw new Error(`Failed to search staff: ${error.message}`);
        }
    }

    async getStaffStatistics() {
        try {
            return await this.staffRepository.getStaffStatistics();
        } catch (error) {
            throw new Error(`Failed to get staff statistics: ${error.message}`);
        }
    }

    async getStaffPerformance(staffId, startDate, endDate) {
        ValidationService.validateUUID(staffId, 'Staff ID');
        ValidationService.validateDateRange(startDate, endDate);
        
        try {
            return await this.staffRepository.getStaffPerformanceData(staffId, startDate, endDate);
        } catch (error) {
            throw new Error(`Failed to get staff performance: ${error.message}`);
        }
    }

    async paginateStaff(page = 1, limit = 10, filters = {}) {
        ValidationService.validatePaginationParams(page, limit);
        
        const criteria = this._buildFilterCriteria(filters);
        
        try {
            return await this.staffRepository.paginate(page, limit, criteria, {
                relations: '[task.[periode], records]',
                orderBy: { column: 'createdAt', direction: 'asc' }
            });
        } catch (error) {
            throw new Error(`Failed to paginate staff: ${error.message}`);
        }
    }

    // Private methods
    _sanitizeStaffData(data) {
        const sanitized = {};
        
        if (data.name !== undefined) sanitized.name = String(data.name).trim();
        if (data.jabatan !== undefined) sanitized.jabatan = String(data.jabatan).trim();
        if (data.nip !== undefined) {
            // Keep only digits for NIP to avoid validation failures
            sanitized.nip = String(data.nip).replace(/\D/g, '');
        }
        if (data.tunjangan !== undefined) sanitized.tunjangan = String(data.tunjangan).trim();
        
        return sanitized;
    }

    _buildFilterCriteria(filters) {
        const criteria = {};
        
        if (filters.jabatan) {
            criteria.jabatan = filters.jabatan;
        }
        
        if (filters.search) {
            // This will be handled differently in repository
            // For now, we'll use a simple name filter
            criteria.name = { like: `%${filters.search}%` };
        }
        
        return criteria;
    }
}

module.exports = StaffService;