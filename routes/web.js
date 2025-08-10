"use strict";

const express = require("express");
const router = express.Router();

const mainController = require("../controllers/mainController");
const staffController = require("../controllers/staffController");
const taskController = require("../controllers/taskController");
const recordsController = require("../controllers/recordsController");
const periodeController = require("../controllers/periodeController");
const settingsController = require("../controllers/settingController");
const authController = require("../controllers/authController");
const passwordResetController = require("../controllers/passwordResetController");
const apiController = require("../controllers/apiController");
const errorController = require("../controllers/errorController");
const {isLogin, authenticateToken} = require("../middleware/authMidleware");
const checkPasswordReset = require("../middleware/checkPasswordReset");
const {isRole} = require("../middleware/roleMidleware");
const {refreshToken} = require("../controllers/authController");
const {roles, insertRole, editRole, deleteRole} = require("../controllers/roleController");
const rbacController = require("../controllers/rbacController");

/* main route */
router.get("/", authenticateToken, checkPasswordReset, mainController.dashboard);

/* auth route */
router.get("/auth/login", isLogin, authController.login);
router.post("/auth/login", authController.loginPost);
router.get("/auth/register", authController.register);
router.post("/auth/register", authController.registerPost);
router.get("/logout", authController.logout);

/* password reset routes */
router.get("/auth/reset-password", passwordResetController.showResetForm);
router.post("/auth/generate-reset-token", passwordResetController.generateResetToken);
router.post("/auth/reset-password-with-token", passwordResetController.resetPasswordWithToken);
router.get("/auth/force-reset", authenticateToken, passwordResetController.showForceResetForm);
router.post("/auth/force-reset-password", authenticateToken, passwordResetController.forceResetPassword);

/* Note: Staff, Task, Periode, and Records routes are now defined below with role-based access control */

/* settings route */
router.get("/settings", authenticateToken, checkPasswordReset, isRole(4), settingsController.settings);
router.post("/settings/update-profile", authenticateToken, checkPasswordReset, isRole(4), settingsController.updateProfile);

/* role management routes - require role management permission (3) */
router.get("/roles", authenticateToken, checkPasswordReset, isRole(3), roles);
router.post("/administrator/insert-role", authenticateToken, isRole(3), insertRole);
router.post("/administrator/edit-role", authenticateToken, isRole(3), editRole);
router.get("/delete-role/:id", authenticateToken, isRole(3), deleteRole);

/* RBAC Control routes */
router.get("/rbac-control", authenticateToken, checkPasswordReset, isRole(3), rbacController.dashboard);
router.post("/rbac-control/update-permissions", authenticateToken, isRole(3), rbacController.updatePermissionMatrix);
router.get("/rbac-control/search-users", authenticateToken, isRole(3), rbacController.searchUsers);
router.post("/rbac-control/assign-role", authenticateToken, isRole(3), rbacController.assignRole);
router.get("/rbac-control/role-stats", authenticateToken, isRole(3), rbacController.getRoleStats);
router.get("/rbac-control/audit-trail", authenticateToken, isRole(3), rbacController.getAuditTrail);
router.post("/rbac-control/bulk-operations", authenticateToken, isRole(3), rbacController.bulkRoleOperations);

/* staff management routes - require user management permission (4) */
router.get("/staff", authenticateToken, checkPasswordReset, isRole(4), staffController.staff);
router.post("/addStaff", authenticateToken, isRole(4), staffController.addStaff);
router.post("/updateStaff/:id", authenticateToken, isRole(4), staffController.updateStaff);
router.get("/deleteStaff/:id", authenticateToken, isRole(4), staffController.deleteStaff);

/* task management routes - require posts management permission (1) */
router.get("/addTask/:id", authenticateToken, checkPasswordReset, isRole(1), taskController.task);
router.post("/addTask", authenticateToken, isRole(1), taskController.addTask);
router.post("/updateTask/:id", authenticateToken, isRole(1), taskController.updateTask);
router.get("/deleteTask/:id/:staffId", authenticateToken, isRole(1), taskController.deleteTask);

/* periode management routes - require categories management permission (2) */
router.get("/periode", authenticateToken, checkPasswordReset, isRole(2), periodeController.periode);
router.post("/addPeriode", authenticateToken, isRole(2), periodeController.addPeriode);
router.post("/updatePeriode/:id", authenticateToken, isRole(2), periodeController.updatePeriode);
router.get("/deletePeriode/:id", authenticateToken, isRole(2), periodeController.deletePeriode);

/* records routes - require posts management permission (1) */
router.get("/data", authenticateToken, checkPasswordReset, isRole(1), recordsController.records);
router.post("/addRecordTask/:id", authenticateToken, isRole(1), recordsController.addRecords);
router.post('/filterRecords', authenticateToken, isRole(1), recordsController.filterRecords);

/* refresh token route */
router.get('/auth/refresh-token', refreshToken);

/* current user route - Updated to use Objection.js */
router.get('/users/current-user', authenticateToken, async (req, res) => {
    const User = require('../models/User');
    try {
        const user = await User.query().findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ email: user.email });
    } catch (err) {
        console.error('Error fetching current user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/dashboard', mainController.dashboard);

/* Test email endpoint - hanya untuk development */
if (process.env.NODE_ENV === 'development') {
    router.get('/test-email', async (req, res) => {
        try {
            const EmailService = require('../services/EmailService');
            const isConnected = await EmailService.testConnection();
            
            res.json({ 
                success: isConnected, 
                message: isConnected ? '✅ Email connection successful' : '❌ Email connection failed',
                timestamp: new Date().toISOString(),
                config: {
                    host: process.env.SMTP_HOST || 'Not configured',
                    port: process.env.SMTP_PORT || 'Not configured',
                    user: process.env.SMTP_USER ? '***configured***' : 'Not configured'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '❌ Error testing email connection',
                error: error.message
            });
        }
    });

    router.get('/test-send-email', async (req, res) => {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Parameter email diperlukan. Contoh: /test-send-email?email=test@example.com'
                });
            }

            const EmailService = require('../services/EmailService');
            const crypto = require('crypto');
            const testToken = crypto.randomBytes(32).toString('hex');
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            
            const result = await EmailService.sendPasswordResetEmail(email, testToken, baseUrl);
            
            res.json({
                success: result.success,
                message: result.success ? '✅ Test email berhasil dikirim' : '❌ Gagal mengirim test email',
                email: email,
                messageId: result.messageId || null,
                error: result.error || null,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '❌ Error sending test email',
                error: error.message
            });
        }
    });
}

router.use(errorController.error404);

module.exports = router;
