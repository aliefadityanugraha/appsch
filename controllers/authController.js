"use strict";

const {PrismaClient} = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");
const jsonWebToken = require("jsonwebtoken");

module.exports = {
    login: (req, res) => {

        res.status(200).render("login", {
            layout: "layouts/auth-layouts",
            title: "Login",
        });

    },

    loginPost: async (req, res) => {

        try {
            const {email, password} = req.body;
            const user = await prisma.user.findUnique({where: {email}});

            if (!user) {
                req.flash("message", "Invalid email or password");
                return res.redirect("/auth/login");
            }

            const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

            if (user.password !== hashedPassword) {
                req.flash("message", "Invalid email or password");
                return res.redirect("/auth/login");
            }

            const accessToken = jsonWebToken.sign(
                {userId: user.id, email: user.email},
                process.env.ACCESS_SECRET_KEY,
                {expiresIn: "1m"}
            );

            const refreshToken = jsonWebToken.sign(
                {userId: user.id, email: user.email},
                process.env.REFRESH_SECRET_KEY,
                {expiresIn: "7d"}
            );

            await prisma.user.update({
                where: {id: user.id},
                data: {refreshToken},
            });

            req.session.token = accessToken;
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.redirect("/");

        } catch (error) {
            console.error("Login error:", error);
            req.flash("message", "An error occurred during login");
            res.redirect("/auth/login");
        }

    },

    register: (req, res) => {

        res.status(200).render("register", {
            layout: "layouts/auth-layouts",
            message: req.flash("message"),
            title: "Register",
        });

    },

    registerPost: async (req, res) => {

        try {
            const {email, password} = req.body;

            const existingUser = await prisma.user.findUnique({where: {email}});
            if (existingUser) {
                req.flash("message", "Email already in use");
                return res.status(400).redirect("/auth/register");
            }

            const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

            const newUser = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                },
            });

            const token = jsonWebToken.sign(
                {userId: newUser.id, email: newUser.email},
                process.env.ACCESS_SECRET_KEY,
                {expiresIn: "12h"}
            );

            req.session.token = token;
            req.flash("message", "Registration successful");
            res.status(201).redirect("/");

        } catch (error) {
            console.error("Registration error:", error);
            req.flash("message", "An error occurred during registration");
            res.status(500).json({message: "Error"});
        }

    },

    refreshToken: async (req, res) => {

        try {
            console.log("Get Refresh token");
            const {refreshToken} = req.cookies;

            if (!refreshToken) return res.status(401).json({message: "Unauthorized"});

            const user = await prisma.user.findFirst({where: {refreshToken}});

            if (!user) return res.status(403).json({message: "Forbidden"});

            console.log("Refresh token:", refreshToken);
            jsonWebToken.verify(refreshToken, process.env.REFRESH_SECRET_KEY, (err, decoded) => { // 🔥 Gunakan REFRESH_SECRET_KEY
                if (err) return res.status(403).json({message: "Forbidden"});

                const accessToken = jsonWebToken.sign(
                    {userId: user.id, email: user.email},
                    process.env.ACCESS_SECRET_KEY,
                    {expiresIn: "15m"}
                );

                req.session.token = accessToken;
                res.redirect('/');
            });

        } catch (error) {

            console.error("Refresh token error:", error);
            res.status(500).json({message: "Error"});

        }

    },

    logout: async (req, res) => {

        try {

            const {refreshToken} = req.cookies;

            if (!refreshToken) {
                return res.status(400).json({message: "No refresh token provided"});
            }

            const user = await prisma.user.findFirst({where: {refreshToken}});

            if (!user) {
                return res.status(403).json({message: "Invalid refresh token"});
            }

            await prisma.user.update({
                where: {id: user.id},
                data: {refreshToken: null}
            });

            res.clearCookie("refreshToken");
            req.session.token = null;
            req.flash("message", "You have been logged out");
            res.redirect("/auth/login");

        } catch (error) {

            console.error("Logout error:", error);
            res.status(500).json({message: "Error"});

        }
    }
};
