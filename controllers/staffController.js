"use strict";

const Staff = require('../models/Staff');
const Periode = require('../models/Periode');

module.exports = {

    staff: async (req, res) => {
        try {
            const data = await Staff.query()
                .withGraphFetched('[task.[periode], records]')
                .orderBy('createdAt', 'asc');

            const listPeriode = await Periode.query();
            const message = req.flash('message');
            const type = req.flash('type');
            
            res.status(200).render("staff", {
                layout: "layouts/main-layouts",
                title: "Data Staff",
                data,
                listPeriode: listPeriode,
                req: req.path,
                message: message.length > 0 ? message[0] : '',
                type: type.length > 0 ? type[0] : 'success'
            });
        } catch (error) {
            console.error('Error fetching staff:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    addStaff: async (req, res) => {
        try {
            const { name, jabatan, nip, tunjangan } = req.body;

            await Staff.query().insert({
                name,
                jabatan,
                nip,
                tunjangan
            });

            req.flash('message', 'Data karyawan berhasil ditambahkan!');
            req.flash('type', 'success');
            res.redirect('/staff');
        } catch (error) {
            console.error('Error adding staff:', error);
            req.flash('message', 'Gagal menambahkan data karyawan!');
            req.flash('type', 'error');
            res.redirect('/staff');
        }
    },

    updateStaff: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, jabatan, nip, tunjangan } = req.body;

            await Staff.query()
                .findById(id)
                .patch({
                    name: name,
                    jabatan: jabatan,
                    nip: nip,
                    tunjangan: tunjangan,
                });

            req.flash('message', 'Data karyawan berhasil diupdate!');
            req.flash('type', 'success');
            res.redirect('/staff');
        } catch (error) {
            console.error('Error updating staff:', error);
            req.flash('message', 'Gagal mengupdate data karyawan!');
            req.flash('type', 'error');
            res.redirect('/staff');
        }
    },

    deleteStaff: async (req, res) => {
        try {
            const { id } = req.params;

            await Staff.query().deleteById(id);
            res.status(200).redirect("/staff");
        } catch (error) {
            console.error('Error deleting staff:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};
