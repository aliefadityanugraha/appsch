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
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, jwtConfig.SECRET_KEY, (err, user) => {
      if (err) return res.status(403).json({ message: "Invalid token" });
      req.user = user;
      next();
    });
  },
};
