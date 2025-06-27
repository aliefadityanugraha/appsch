"use strict";

const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {

    staff: async (req, res) => {

        const data = await prisma.staff.findMany({
            include: {
                task: {
                    include: {
                        periode: true,
                    },
                },
                records: true,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        const listPeriode = await prisma.periode.findMany({});
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

    },

    addStaff: async (req, res) => {

        const {name, jabatan, nip, tunjangan} = req.body;

        await prisma.staff.create({
            data: {name, jabatan, nip, tunjangan},
        });
        req.flash('message', 'Data karyawan berhasil ditambahkan!');
        req.flash('type', 'success');
        res.redirect('/staff');

    },

    updateStaff: async (req, res) => {

        const {id} = req.params;
        const {name, jabatan, nip, tunjangan} = req.body;

        await prisma.staff.update({
            where: {id},
            data: {name, jabatan, nip, tunjangan, updatedAt: new Date()},
        });
        req.flash('message', 'Data karyawan berhasil diupdate!');
        req.flash('type', 'success');
        res.redirect('/staff');

    },

    deleteStaff: async (req, res) => {

        const {id} = req.params;

        await prisma.staff.delete({
            where: {id},
        });
        res.status(200).redirect("/staff");

    },
};
