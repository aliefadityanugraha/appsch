"use strict";

const express = require("express");
const app = express();

require("dotenv").config();
const path = require("path");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");

const flashConfig = require("./config/flash");
const sessionConfig = require("./config/session");
const { checkDatabaseConnection } = require("./config/database");
const { renderDatabaseError } = require("./controllers/errorController");

const webRoute = require("./routes/web");
const apiRoute = require("./routes/api");

app.use(cookieParser());
app.use(sessionConfig.session);
let session;
app.use(flash());
app.use(flashConfig.flash);
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use("/public", express.static(path.join(__dirname, "public")));

// Database connection check middleware
app.use(async (req, res, next) => {
    // Skip database check for static files
    if (req.path.startsWith('/public/')) {
        return next();
    }
    
    try {
        const dbCheck = await checkDatabaseConnection();
        if (!dbCheck.success) {
            return renderDatabaseError(req, res, dbCheck.error);
        }
        next();
    } catch (error) {
        return renderDatabaseError(req, res, error.message);
    }
});

app.use("/", apiRoute);
app.use("/", webRoute);

module.exports = app;
