"use strict"

module.exports = {
    flash: (req, res, next) => {
        res.locals.messages = {
            error: req.flash("error")[0] || null,
            success: req.flash("success")[0] || null,
            warning: req.flash("warning")[0] || null,
            info: req.flash("info")[0] || null
        };
        // Keep backward compatibility
        res.locals.message = req.flash("message");
        next();
    }
}