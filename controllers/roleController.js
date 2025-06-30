"use strict";

const Role = require('../models/Role');

module.exports = {

    roles: (req, res) => {
        res.render("roles", {
            layout: "layouts/main-layouts",
            title: "Roles",
            req: req.path,
        });
    },

    insertRole: async (req, res) => {
        try {
            let permission = [];

            if (req.body.dashboardPermission) {
                permission.push(1);
            }
            if (req.body.staffPermission) {
                permission.push(2);
            }
            if (req.body.periodePermission) {
                permission.push(3);
            }
            if (req.body.recordspermission) {
                permission.push(4);
            }

            await Role.query().insert({
                role: req.body.role,
                permission: permission,
                description: req.body.description,
            });
            
            res.status(200).redirect("/roles");
        } catch (error) {
            console.error('Error inserting role:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};