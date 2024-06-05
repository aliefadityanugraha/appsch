/** @format */

"use strict";

const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

module.exports = {
  isLogin: (req, res, next) => {
    const session = req.session;
    if (!session.token) {
      console.log("Session not found");
      res.status(200).redirect("/auth/login");
    } else {
      jwt.verify(session.token, jwtConfig.SECRET_KEY);
      next();
    }
  },
};
