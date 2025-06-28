"use strict";

const Periode = require('../models/Periode');

module.exports = {

    periode: async (req, res) => {
        try {
            // Equivalent to prisma.periode.findMany()
            const data = await Periode.query();

            res.status(200).render("periode", {
                layout: "layouts/main-layouts",
                title: "Periode",
                data: data,
                req: req.path,
            });
        } catch (error) {
            console.error('Error fetching periode:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    addPeriode: async (req, res) => {
        try {
            const { periode, nilai } = req.body;

            // Equivalent to prisma.periode.create({data: {periode, nilai: parseInt(nilai)}})
            await Periode.query().insert({
                periode: periode,
                nilai: parseInt(nilai),
            });
            
            res.status(200).redirect("/periode");
        } catch (error) {
            console.error('Error adding periode:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    updatePeriode: async (req, res) => {
        try {
            const { periode, nilai } = req.body;

            // Equivalent to prisma.periode.update({where: {id: req.params.id}, data: {...}})
            await Periode.query()
                .findById(req.params.id)
                .patch({
                    periode: periode,
                    nilai: parseInt(nilai),
                });
                
            res.status(200).redirect("/periode");
        } catch (error) {
            console.error('Error updating periode:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    deletePeriode: async (req, res) => {
        try {
            const idPeriode = req.params.id;

            // Equivalent to prisma.periode.delete({ where: { id: idPeriode } })
            await Periode.query().deleteById(idPeriode);

            res.status(200).redirect("/periode");
        } catch (error) {
            console.error('Error deleting periode:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}; 