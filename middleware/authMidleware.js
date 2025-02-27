/** @format */

"use strict";

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config/jwt");

module.exports = {
  isLogin: (req, res, next) => {
    const { token } = req.session;

    if (!token) {
      console.log("Session not found");
      return res.status(401).redirect("/login");
    }

    try {
      jwt.verify(token, SECRET_KEY);
      next();
    } catch (error) {
      console.error("Invalid token:", error.message);
      return res.status(403).redirect("/login");
    }
  },

  authenticateToken: (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }
      req.user = user;
      next();
    });
  },
};
