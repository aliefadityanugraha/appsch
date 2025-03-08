/** @format */

"use strict";

const jwt = require("jsonwebtoken");

module.exports = {
    isLogin: (req, res, next) => {
        const {token} = req.session;

        if (!token) return res.redirect("/auth/login");

        try {
            jwt.verify(token, process.env.ACCESS_SECRET_KEY);
            next();
        } catch (error) {
            console.error("Invalid token:", error.message);
            return res.status(403).redirect("/auth/login");
        }
    },

    authenticateToken: (req, res, next) => {

        const {token} = req.session;

        if (!token) {
            console.log("Session not found");
            return res.status(401).redirect("/auth/login");
        }

        jwt.verify(token, process.env.ACCESS_SECRET_KEY, (err, user) => {
            if (err) {
                console.error("Invalid or expired token:", err.message);

                if (req.path === "/auth/refresh-token") {
                    return res.status(403).json({message: "Forbidden"});
                }

                return res.redirect("/auth/refresh-token");
            }

            req.user = user;
            next();
        });

    }
};
