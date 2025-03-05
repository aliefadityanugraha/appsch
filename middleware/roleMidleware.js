/** @format */

"use strict";

const Role = require("../models/roleModel");
const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

const isRole = (perm) => {
  return async (req, res, next) => {
    const session = req.session;
    const token = jwt.verify(session.token, jwtConfig.SECRET_KEY);

    const findRole = await Role.find({ roleId: token.user.role }).exec();
    const userPermit = findRole[0].permission;

    if (findRole.length > 0) {
      if (userPermit.includes(perm)) {
        next();
      } else {
        res.redirect("/");
      }
    } else {
      res.status(401).json("erros roles session");
    }
  };
};

module.exports = {
  isRole,
};
