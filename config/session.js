"use strict";

const sessions = require("express-session");

const expireSessionIn = 60000 * 60 * 12;

module.exports = {
    session: sessions({
        secret: "appschsmatajaya",
        saveUninitialized: true,
        cookie: {maxAge: expireSessionIn},
        resave: false,
    })
};
