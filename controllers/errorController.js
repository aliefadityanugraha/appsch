"use strict";

module.exports = {
    error404: (req, res) => {
        res.status(404).redirect('/');
    }
}