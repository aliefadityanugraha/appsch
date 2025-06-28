"use strict";

/**
 * Render database connection error page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {string} error - Database error message
 */
function renderDatabaseError(req, res, error) {
    res.status(503).render('error/database-error', {
        title: 'Database Connection Error',
        error: error,
        layout: false // Don't use layout for error pages
    });
}

module.exports = {
    error404: (req, res) => {
        res.status(404).render("error/404", {
            layout: "layouts/auth-layouts",
        });
    },
    renderDatabaseError
}