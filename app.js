/** @format */

"use strict";

const express = require("express");
// const mongoose = require("./config/mongose");
// const sessionConfig = require("./config/session");

const app = express();

const bodyParser = require("body-parser");
const path = require("path");
const methodOverride = require("method-override");
const expressLayouts = require("express-ejs-layouts");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
// const multer = require("./config/multer");
var flash = require("connect-flash");

const routerV1 = require("./routes/route");
// const routerV2 = require("./routes/v2");


// app.use(sessionConfig.sessionConf);
var session;
// app.use(multer);
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(flash());

app.use("/", routerV1);
// app.use("/", routerV2);

module.exports = app;
