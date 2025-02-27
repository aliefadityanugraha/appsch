"use strict";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config/jwt");

module.exports = {
  login: (req, res) => {
    res.render("login", {
      layout: "layouts/auth-layouts",
      message: req.flash("message"),
      title: "Login",
    });
  },
  loginPost: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        req.flash("message", "Invalid email or password");
        return res.status(401).redirect("/login");
      }

      const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

      if (user.password !== hashedPassword) {
        req.flash("message", "Invalid email or password");
        return res.status(401).redirect("/login");
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        SECRET_KEY,
        { expiresIn: "12h" }
      );

      req.session.token = token;

      res.status(200).redirect("/");
    } catch (error) {
      console.error("Login error:", error);
      req.flash("message", "An error occurred during login");
      res.status(500).redirect("/login");
    }
  },
  register: (req, res) => {
    res.render("register", {
      layout: "layouts/auth-layouts",
      message: req.flash("message"),
      title: "Register",
    });
  },
  registerPost: async (req, res) => {
    try {
      const { email, password } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        req.flash("message", "Email already in use");
        return res.status(400).redirect("/register");
      }

      const hashedPassword = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        SECRET_KEY,
        { expiresIn: "12h" }
      );

      req.session.token = token;
      req.flash("message", "Registration successful");
      res.status(201).redirect("/login");
    } catch (error) {
      console.error("Registration error:", error);
      req.flash("message", "An error occurred during registration");
      res.status(500).redirect("/register");
    }
  },
  logout: (req, res) => {
    req.session.token = null;
    req.flash("message", "You have been logged out");
    res.redirect("/login");
  },
};
