"use strict"

module.exports = {
    flash: (req, res, next) => {
        res.locals.message = req.flash("message");
        next();
    }
}