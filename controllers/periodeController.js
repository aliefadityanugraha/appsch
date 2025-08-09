"use strict";

const Periode = require('../models/Periode');
const ResponseFormatter = require('../utils/ResponseFormatter');

class PeriodeController {
    constructor() {
        // Using model directly to keep schema consistent with current DB
    }

    periode = ResponseFormatter.asyncHandler(async (req, res) => {
        const data = await Periode.query().orderBy('createdAt', 'asc').withGraphFetched('tasks');
        
        const message = req.flash('message');
        const type = req.flash('type');
        
        ResponseFormatter.renderView(req, res, 'periode', {
            layout: "layouts/main-layouts",
            title: "Data Periode",
            data,
            listPeriode: data,
            req: req.path,
            message: message.length > 0 ? message[0] : '',
            type: type.length > 0 ? type[0] : 'success'
        });
    })

    addPeriode = ResponseFormatter.asyncHandler(async (req, res) => {
        const { periode, nilai } = req.body;

        await Periode.query().insert({
            periode,
            nilai: parseInt(nilai)
        });

        ResponseFormatter.redirectWithFlash(req, res, '/periode', 'Data periode berhasil ditambahkan!', 'success');
    })

    updatePeriode = ResponseFormatter.asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { periode, nilai } = req.body;

        await Periode.query().patchAndFetchById(id, {
            periode,
            nilai: parseInt(nilai)
        });

        ResponseFormatter.redirectWithFlash(req, res, '/periode', 'Data periode berhasil diupdate!', 'success');
    })

    deletePeriode = ResponseFormatter.asyncHandler(async (req, res) => {
        const { id } = req.params;
        await Periode.query().deleteById(id);
        
        ResponseFormatter.redirectWithFlash(req, res, '/periode', 'Data periode berhasil dihapus!', 'success');
    })
}

module.exports = new PeriodeController();