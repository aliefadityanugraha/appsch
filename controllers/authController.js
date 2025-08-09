"use strict";

const User = require('../models/User');
const bcrypt = require('bcrypt');
const jsonWebToken = require("jsonwebtoken");

module.exports = {

    login: (req, res) => {
        res.status(200).render("login", {
            layout: "layouts/auth-layouts",
            title: "Login",
        });
    },

    loginPost: async (req, res) => {
        console.log('🔐 Login attempt started...');
        console.log('📝 Request body:', req.body);
        
        try {
            const { email, password } = req.body;
            console.log('📧 Email:', email);
            console.log('🔑 Password provided:', password ? 'Yes' : 'No');
            
            if (!email || !password) {
                console.log('❌ Missing email or password');
                req.flash("message", "Email and password are required");
                return res.redirect("/auth/login");
            }
            
            // Use custom method with logging
            console.log('🔍 Searching for user with email:', email);
            const user = await User.findByEmail(email);

            if (!user) {
                console.log('❌ User not found');
                req.flash("message", "Invalid email or password");
                return res.redirect("/auth/login");
            }

            console.log('✅ User found:');
            console.log('   ID:', user.id);
            console.log('   Email:', user.email);
            console.log('   Status:', user.status);
            console.log('   Role:', user.role);
            console.log('   Has password:', user.password ? 'Yes' : 'No');
            console.log('   Password length:', user.password ? user.password.length : 0);

            // Check if user has a password set
            if (!user.password || user.password.trim() === '') {
                console.log('❌ User has no password set');
                req.flash("message", "Account requires password setup. Please contact administrator.");
                return res.redirect("/auth/login");
            }

            console.log('🔐 Verifying password with bcrypt...');
            const isPasswordValid = await bcrypt.compare(password, user.password);
            console.log('   Password match:', isPasswordValid);

            if (!isPasswordValid) {
                console.log('❌ Password does not match');
                req.flash("message", "Invalid email or password");
                return res.redirect("/auth/login");
            }

            console.log('✅ Password verified successfully');

            // Check JWT secrets
            console.log('🔑 Checking JWT secrets...');
            if (!process.env.ACCESS_SECRET_KEY) {
                console.log('❌ ACCESS_SECRET_KEY not found');
                req.flash("message", "Server configuration error");
                return res.redirect("/auth/login");
            }
            
            if (!process.env.REFRESH_SECRET_KEY) {
                console.log('❌ REFRESH_SECRET_KEY not found');
                req.flash("message", "Server configuration error");
                return res.redirect("/auth/login");
            }
            
            console.log('✅ JWT secrets found');

            console.log('🎫 Creating JWT tokens...');
            const accessToken = jsonWebToken.sign(
                { userId: user.id, email: user.email },
                process.env.ACCESS_SECRET_KEY,
                { expiresIn: "15m" }
            );

            const refreshToken = jsonWebToken.sign(
                { userId: user.id, email: user.email },
                process.env.REFRESH_SECRET_KEY,
                { expiresIn: "7d" }
            );

            console.log('✅ JWT tokens created:');
            console.log('   Access token length:', accessToken.length);
            console.log('   Refresh token length:', refreshToken.length);

            console.log('💾 Updating user with refresh token...');
            // Use custom method with logging
            await User.updateRefreshToken(user.id, refreshToken);
            console.log('✅ User updated successfully');

            console.log('🍪 Setting session and cookies...');
            req.session.token = accessToken;
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 3 * 24 * 60 * 60 * 1000,
            });

            console.log('✅ Session and cookies set');
            console.log('🎉 Login successful! Redirecting to /');

            res.redirect("/");

        } catch (error) {
            console.error("❌ Login error occurred:");
            console.error("   Error message:", error.message);
            console.error("   Error stack:", error.stack);
            console.error("   Error code:", error.code);
            
            // More specific error messages
            if (error.code === 'ER_NO_SUCH_TABLE') {
                console.error("   Issue: User table does not exist");
                req.flash("message", "Database setup error - please contact administrator");
            } else if (error.code === 'ECONNREFUSED') {
                console.error("   Issue: Cannot connect to database");
                req.flash("message", "Database connection error - please try again later");
            } else if (error.message.includes('jwt')) {
                console.error("   Issue: JWT signing error");
                req.flash("message", "Authentication error - please contact administrator");
            } else {
                req.flash("message", "An error occurred during login");
            }
            
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
            const { email, password } = req.body;

            const existingUser = await User.query().where('email', email).first();
            
            if (existingUser) {
                req.flash("message", "Email already in use");
                return res.status(400).redirect("/auth/register");
            }

            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const newUser = await User.query().insert({
                email,
                password: hashedPassword,
            });

            const token = jsonWebToken.sign(
                { userId: newUser.id, email: newUser.email },
                process.env.ACCESS_SECRET_KEY,
                { expiresIn: "12h" }
            );

            req.session.token = token;
            req.flash("message", "Registration successful");
            res.status(201).redirect("/");

        } catch (error) {
            console.error("Registration error:", error);
            req.flash("message", "An error occurred during registration");
            res.status(500).json({ message: "Error" });
        }
    },

    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).json({ message: "Error logging out" });
            }
            
            res.clearCookie("refreshToken");
            res.redirect("/auth/login");
        });
    },

    refreshToken: async (req, res) => {
        const { refreshToken } = req.cookies;
        if (!refreshToken) return res.redirect("/auth/login");

        try {
            const user = await User.query().where('refreshToken', refreshToken).first();
            if (!user) return res.redirect("/auth/login");

            jsonWebToken.verify(refreshToken, process.env.REFRESH_SECRET_KEY, (err, decoded) => {
                if (err) return res.redirect("/auth/login");

                const accessToken = jsonWebToken.sign(
                    { userId: user.id, email: user.email },
                    process.env.ACCESS_SECRET_KEY,
                    { expiresIn: '15m' }
                );

                // Set session/cookie baru
                req.session.token = accessToken;

                // Jika request dari browser, redirect ke dashboard
                if (req.headers.accept && req.headers.accept.includes('text/html')) {
                    return res.redirect("/");
                }

                // Jika request dari API, return JSON
                res.json({ accessToken });
            });
        } catch (error) {
            console.error(error);
            res.redirect("/auth/login");
        }
    },


    handleLogin: async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ 'message': 'Email and password are required.' });

        const foundUser = await User.query().where({ email: email }).first();
        if (!foundUser) return res.sendStatus(401); 

        const match = (crypto.createHash("sha256").update(password).digest("hex") === foundUser.password);
        if (match) {
            const accessToken = jsonWebToken.sign(
                { "userId": foundUser.id },
                process.env.ACCESS_SECRET_KEY,
                { expiresIn: '30s' }
            );
            const newRefreshToken = jsonWebToken.sign(
                { "userId": foundUser.id },
                process.env.REFRESH_SECRET_KEY,
                { expiresIn: '1d' }
            );

            await User.query().findById(foundUser.id).patch({ refreshToken: newRefreshToken });

            res.cookie('jwt', newRefreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
            res.json({ accessToken });
        } else {
            res.sendStatus(401);
        }
    }
};