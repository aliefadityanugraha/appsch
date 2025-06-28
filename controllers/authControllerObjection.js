"use strict";

const User = require('../models/User');
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

            const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
            console.log('🔐 Password hashing:');
            console.log('   Original password:', password);
            console.log('   Hashed password:', hashedPassword);
            console.log('   Hash length:', hashedPassword.length);

            console.log('🔍 Comparing passwords...');
            console.log('   Stored hash:', user.password);
            console.log('   Computed hash:', hashedPassword);
            console.log('   Match:', user.password === hashedPassword);

            if (user.password !== hashedPassword) {
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

            // Equivalent to prisma.user.findUnique({where: {email}})
            const existingUser = await User.query().where('email', email).first();
            
            if (existingUser) {
                req.flash("message", "Email already in use");
                return res.status(400).redirect("/auth/register");
            }

            const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

            // Equivalent to prisma.user.create({data: {email, password: hashedPassword}})
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
        try {
            const { refreshToken } = req.cookies;

            if (!refreshToken) return res.status(401).json({ message: "Unauthorized" });

            // Equivalent to prisma.user.findFirst({where: {refreshToken}})
            const user = await User.query().where('refreshToken', refreshToken).first();

            if (!user) return res.status(403).redirect("/auth/login");

            jsonWebToken.verify(refreshToken, process.env.REFRESH_SECRET_KEY, async (err, decoded) => {
                if (err) return res.status(403).redirect("/auth/login");

                const accessToken = jsonWebToken.sign(
                    { userId: user.id, email: user.email },
                    process.env.ACCESS_SECRET_KEY,
                    { expiresIn: "1h" }
                );

                console.log("Get Refresh token:", accessToken);
                req.session.token = accessToken;

                const newRefreshToken = jsonWebToken.sign(
                    { userId: user.id, email: user.email },
                    process.env.REFRESH_SECRET_KEY,
                    { expiresIn: "7d" }
                );

                // Equivalent to prisma.user.update({where: {id: user.id}, data: {refreshToken: newRefreshToken}})
                await User.query()
                    .findById(user.id)
                    .patch({ refreshToken: newRefreshToken });

                res.cookie("refreshToken", newRefreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 3 * 24 * 60 * 60 * 1000,
                });

                res.redirect('/');
            });

        } catch (error) {
            console.error("Refresh token error:", error);
            res.status(500).json({ message: "Error" });
        }
    }
}; 