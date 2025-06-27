"use strict";

module.exports = {
    error404: (req, res) => {
        res.status(404).render("error/404", {
            layout: "layouts/auth-layouts",
        });
    }
}