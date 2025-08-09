"use strict";

const StaffService = require('../services/StaffService');
const Periode = require('../models/Periode');
const ResponseFormatter = require('../utils/ResponseFormatter');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

class StaffController {
    constructor() {
        this.staffService = new StaffService();
    }

    staff = ResponseFormatter.asyncHandler(async (req, res) => {
        const [data, listPeriode] = await Promise.all([
            this.staffService.getAllStaff(),
            Periode.query()
        ]);
        
        ResponseFormatter.renderView(req, res, "staff", {
            layout: "layouts/main-layouts",
            title: "Data Staff",
            data,
            listPeriode
        });
    });

    addStaff = ResponseFormatter.asyncHandler(async (req, res) => {
        const { name, jabatan, nip, tunjangan } = req.body;
        
        await this.staffService.createStaff({
            name,
            jabatan,
            nip,
            tunjangan
        });
        
        ResponseFormatter.redirectWithFlash(req, res, '/staff', 'Data karyawan berhasil ditambahkan!', 'success');
    });

    updateStaff = ResponseFormatter.asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, jabatan, nip, tunjangan } = req.body;
        
        await this.staffService.updateStaff(id, {
            name,
            jabatan,
            nip,
            tunjangan
        });
        
        ResponseFormatter.redirectWithFlash(req, res, '/staff', 'Data karyawan berhasil diupdate!', 'success');
    });

    deleteStaff = ResponseFormatter.asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        await this.staffService.deleteStaff(id);
        
        ResponseFormatter.redirectWithFlash(req, res, '/staff', 'Data karyawan berhasil dihapus!', 'success');
    });

    getStaffAPI = ResponseFormatter.asyncHandler(async (req, res) => {
        const data = await this.staffService.getAllStaff();
        
        ResponseFormatter.sendSuccess(res, {
            message: 'Staff data retrieved successfully',
            data: data
        });
    });
}

// Export instance of the controller
module.exports = new StaffController();
