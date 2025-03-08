"use strict";

module.exports = {
    settings: (req, res) => {
        res.render("settings", {
            layout: "layouts/main-layouts",
            title: "Settings",
            req: req.path,
        });
    },
};
