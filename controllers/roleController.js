"use strict";

const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {

    roles: (req, res) => {

        res.render("roles", {
            layout: "layouts/main-layouts",
            title: "Roles",
            req: req.path,
        });

    },

    insertRole: async (req, res) => {
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

        const result = await prisma.role.create({
            data: {
                role: req.body.role,
                permission: permission,
                description: req.body.description,
            },
        });
        res.status(200).redirect("/roles");
    }
}