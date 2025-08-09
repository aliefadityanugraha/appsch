/** @format */

"use strict";

const jwt = require("jsonwebtoken");

module.exports = {
    isLogin: (req, res, next) => {
        console.log('🔐 isLogin middleware called...');
        console.log('📝 Request path:', req.path);
        console.log('🍪 Session token:', req.session.token ? 'Exists' : 'Not found');
        
        const {token} = req.session;

        if (token) {
            console.log('✅ User already logged in, redirecting to /');
            return res.redirect("/");
        }

        console.log('✅ User not logged in, proceeding...');
        next();
    },

    authenticateToken: (req, res, next) => {
        console.log('🔐 authenticateToken middleware called...');
        console.log('📝 Request path:', req.path);
        console.log('🍪 Session exists:', req.session ? 'Yes' : 'No');
        console.log('🍪 Session token:', req.session.token ? 'Exists' : 'Not found');
        console.log('🔑 ACCESS_SECRET_KEY exists:', process.env.ACCESS_SECRET_KEY ? 'Yes' : 'No');

        const {token} = req.session;

        if (!token) {
            console.log("❌ Session token not found");
            console.log("🔄 Redirecting to login");
            return res.status(401).redirect("/auth/login");
        }

        console.log('🎫 Verifying JWT token...');
        jwt.verify(token, process.env.ACCESS_SECRET_KEY, (err, user) => {
            if (err) {
                console.error("❌ Invalid or expired token:", err.message);
                console.error("   Error name:", err.name);
                console.error("   Error expiredAt:", err.expiredAt);

                if (req.path === "/auth/refresh-token") {
                    console.log("🔄 Refresh token path, returning forbidden");
                    return res.status(403).json({message: "Forbidden"});
                }

                console.log("🔄 Redirecting to refresh token");
                return res.redirect("/auth/refresh-token");
            }

            console.log('✅ Token verified successfully');
            console.log('👤 User data:', { userId: user.userId, email: user.email });
            req.user = user;
            next();
        });
    }
};
