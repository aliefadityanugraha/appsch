/** @format */
"use strict";

const express = require("express");
const sessionConfig = require("./config/session");

const app = express();

const bodyParser = require("body-parser");
const path = require("path");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
// const multer = require("./config/multer");
let flash = require("connect-flash");

const routerV1 = require("./routes/route");

app.use(sessionConfig.sessionConf);
let session;
// app.use(multer);
app.use(flash());
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(cookieParser());


app.use("/", routerV1);

module.exports = app;
