const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

class AuthController {
    constructor() {
        // Dependencies could be injected for testing
        this.User = User;
    }

    // Helper: Generate JWT tokens
    generateTokens(userId, email) {
        return {
            accessToken: jwt.sign({ userId, email }, process.env.ACCESS_SECRET_KEY, { expiresIn: "15m" }),
            refreshToken: jwt.sign({ userId, email }, process.env.REFRESH_SECRET_KEY, { expiresIn: "7d" })
        };
    }

    // Helper: Validate credentials
    validateCredentials(email, password) {
        if (!email || !password) {
            throw new Error('EMAIL_PASSWORD_REQUIRED');
        }
        if (!process.env.ACCESS_SECRET_KEY || !process.env.REFRESH_SECRET_KEY) {
            throw new Error('JWT_CONFIG_ERROR');
        }
    }

    // Helper: Handle error messages
    getErrorMessage(errorCode) {
        const messages = {
            'EMAIL_PASSWORD_REQUIRED': 'Email and password are required',
            'JWT_CONFIG_ERROR': 'Server configuration error'
        };
        return messages[errorCode] || "An error occurred during login";
    }

    login = (req, res) => {
        res.render("login", {
            layout: "layouts/auth-layouts",
            title: "Login",
        });
    }

    loginPost = async (req, res) => {
        try {
            const { email, password } = req.body;
            
            this.validateCredentials(email, password);
            
            const user = await this.User.findByEmail(email);
            if (!user || !user.password?.trim()) {
                req.flash("message", "Invalid email or password");
                return res.redirect("/auth/login");
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                req.flash("message", "Invalid email or password");
                return res.redirect("/auth/login");
            }

            const { accessToken, refreshToken } = this.generateTokens(user.id, user.email);
            
            await this.User.updateRefreshToken(user.id, refreshToken);

            req.session.token = accessToken;
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.redirect("/");
        } catch (error) {
            req.flash("message", this.getErrorMessage(error.message));
            res.redirect("/auth/login");
        }
    }

    register = (req, res) => {
        res.render("register", {
            layout: "layouts/auth-layouts",
            title: "Register",
        });
    }

    registerPost = async (req, res) => {
        try {
            const { email, password } = req.body;

            const existingUser = await this.User.query().where('email', email).first();
            if (existingUser) {
                req.flash("message", "Email already in use");
                return res.redirect("/auth/register");
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = await this.User.query().insert({ email, password: hashedPassword });

            const { accessToken } = this.generateTokens(newUser.id, newUser.email);
            req.session.token = accessToken;
            
            req.flash("message", "Registration successful");
            res.redirect("/");
        } catch (error) {
            req.flash("message", "An error occurred during registration");
            res.redirect("/auth/register");
        }
    }

    logout = (req, res) => {
        req.session.destroy((err) => {
            if (err) return res.status(500).json({ message: "Error logging out" });
            res.clearCookie("refreshToken");
            res.redirect("/auth/login");
        });
    }

    refreshToken = async (req, res) => {
        const { refreshToken } = req.cookies;
        
        // If no refresh token, clear session and redirect to login
        if (!refreshToken) {
            req.session.destroy(() => {
                return res.redirect("/auth/login");
            });
            return;
        }

        try {
            const user = await this.User.query().where('refreshToken', refreshToken).first();
            if (!user) {
                // Clear session and cookies, then redirect
                req.session.destroy(() => {
                    res.clearCookie("refreshToken");
                    return res.redirect("/auth/login");
                });
                return;
            }

            jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, (err) => {
                if (err) {
                    // Refresh token expired, clear everything
                    req.session.destroy(() => {
                        res.clearCookie("refreshToken");
                        return res.redirect("/auth/login");
                    });
                    return;
                }

                const { accessToken } = this.generateTokens(user.id, user.email);
                req.session.token = accessToken;

                // Redirect to dashboard for browser requests
                if (req.headers.accept?.includes('text/html')) {
                    return res.redirect("/");
                }

                res.json({ accessToken });
            });
        } catch (error) {
            req.session.destroy(() => {
                res.clearCookie("refreshToken");
                return res.redirect("/auth/login");
            });
        }
    }
}

module.exports = new AuthController();