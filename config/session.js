/** @format */

const sessions = require("express-session");

const expireSessionIn = 60000 * 60 * 12;

const sessionConf = sessions({
  secret: "appschsmatajaya",
  saveUninitialized: true,
  cookie: { maxAge: expireSessionIn },
  resave: false,
});

module.exports = {
  sessionConf,
};
