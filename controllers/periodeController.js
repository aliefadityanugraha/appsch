"use strict";

const Periode = require('../models/Periode');

module.exports = {

    periode: async (req, res) => {
        try {
            const data = await Periode.query().orderBy('createdAt', 'asc');
            const message = req.flash('message');
            const type = req.flash('type');
            
            res.status(200).render("periode", {
                layout: "layouts/main-layouts",
                title: "Data Periode",
                data,
                listPeriode: data,
                req: req.path,
                message: message.length > 0 ? message[0] : '',
                type: type.length > 0 ? type[0] : 'success'
            });
        } catch (error) {
            console.error('Error fetching periode:', error);
            res.status(500).render('error/database-error', {
                layout: "layouts/main-layouts",
                title: "Database Error",
                error: error.message
            });
        }
    },

    addPeriode: async (req, res) => {
        try {
            const { periode, nilai } = req.body;

            await Periode.query().insert({
                periode,
                nilai: parseInt(nilai)
            });

            req.flash('message', 'Data periode berhasil ditambahkan!');
            req.flash('type', 'success');
            res.redirect('/periode');
        } catch (error) {
            console.error('Error adding periode:', error);
            req.flash('message', 'Gagal menambahkan data periode!');
            req.flash('type', 'error');
            res.redirect('/periode');
        }
    },

    updatePeriode: async (req, res) => {
        try {
            const { id } = req.params;
            const { periode, nilai } = req.body;

            await Periode.query()
                .findById(id)
                .patch({
                    periode,
                    nilai: parseInt(nilai)
                });

            req.flash('message', 'Data periode berhasil diupdate!');
            req.flash('type', 'success');
            res.redirect('/periode');
        } catch (error) {
            console.error('Error updating periode:', error);
            req.flash('message', 'Gagal mengupdate data periode!');
            req.flash('type', 'error');
            res.redirect('/periode');
        }
    },

    deletePeriode: async (req, res) => {
        try {
            const { id } = req.params;

            await Periode.query().deleteById(id);
            req.flash('message', 'Data periode berhasil dihapus!');
            req.flash('type', 'success');
            res.redirect('/periode');
        } catch (error) {
            console.error('Error deleting periode:', error);
            req.flash('message', 'Gagal menghapus data periode!');
            req.flash('type', 'error');
            res.redirect('/periode');
        }
    }
}; 