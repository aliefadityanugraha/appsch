"use strict";

const Settings = require('../models/Settings');

module.exports = {
    settings: async (req, res) => {
        try {
            // Get all settings
            const settings = await Settings.query();
            
            res.status(200).render("settings", {
                layout: "layouts/main-layouts",
                title: "Settings",
                settings: settings,
                req: req.path,
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    addSetting: async (req, res) => {
        try {
            const { tunjangan, color } = req.body;

            // Equivalent to prisma.settings.create({data: {tunjangan, color}})
            await Settings.query().insert({
                tunjangan,
                color
            });
            
            res.status(200).redirect("/settings");
        } catch (error) {
            console.error('Error adding setting:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    updateSetting: async (req, res) => {
        try {
            const { id } = req.params;
            const { tunjangan, color } = req.body;

            // Equivalent to prisma.settings.update({where: {id}, data: {tunjangan, color}})
            await Settings.query()
                .findById(id)
                .patch({
                    tunjangan,
                    color,
                });
                
            res.status(200).redirect("/settings");
        } catch (error) {
            console.error('Error updating setting:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    deleteSetting: async (req, res) => {
        try {
            const { id } = req.params;

            // Equivalent to prisma.settings.delete({where: {id}})
            await Settings.query().deleteById(id);
            
            res.status(200).redirect("/settings");
        } catch (error) {
            console.error('Error deleting setting:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}; 