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
const errorController = require("../controllers/errorController");
const { isLogin, authenticateToken } = require("../middleware/authMidleware");
const checkPasswordReset = require("../middleware/checkPasswordReset");
const { isRole } = require("../middleware/roleMidleware");
const { refreshToken } = require("../controllers/authController");
const { roles, insertRole, editRole, deleteRole } = require("../controllers/roleController");
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

/* settings route - Permission 4: Manajemen User */
router.get("/settings", authenticateToken, checkPasswordReset, isRole(4), settingsController.settings);
router.post("/settings/update-profile", authenticateToken, checkPasswordReset, isRole(4), settingsController.updateProfile);

/* role management routes */
router.get("/roles", authenticateToken, checkPasswordReset, isRole(3), roles);
router.post("/administrator/insert-role", authenticateToken, isRole(3), insertRole);
router.post("/administrator/edit-role", authenticateToken, isRole(3), editRole);
router.get("/delete-role/:id", authenticateToken, isRole(3), deleteRole);

/* RBAC Control routes */
router.get("/rbac-control", authenticateToken, checkPasswordReset, isRole(3), rbacController.dashboard);
router.get("/api/rbac/search-users", authenticateToken, isRole(3), rbacController.searchUsers);
router.post("/api/rbac/assign-role", authenticateToken, isRole(3), rbacController.assignRole);
router.get("/api/rbac/role-stats", authenticateToken, isRole(3), rbacController.getRoleStats);

/* staff management routes - Permission 1: Penilaian Kinerja */
router.get("/staff", authenticateToken, checkPasswordReset, isRole(1), staffController.staff);
router.post("/addStaff", authenticateToken, isRole(1), staffController.addStaff);
router.post("/updateStaff/:id", authenticateToken, isRole(1), staffController.updateStaff);
router.get("/deleteStaff/:id", authenticateToken, isRole(1), staffController.deleteStaff);

/* task management routes - Permission 1: Penilaian Kinerja */
router.get("/addTask/:id", authenticateToken, checkPasswordReset, isRole(1), taskController.task);
router.post("/addTask", authenticateToken, isRole(1), taskController.addTask);
router.post("/updateTask/:id", authenticateToken, isRole(1), taskController.updateTask);
router.get("/deleteTask/:id/:staffId", authenticateToken, isRole(1), taskController.deleteTask);

/* periode management routes - Permission 2: Kategori Instrumen */
router.get("/periode", authenticateToken, checkPasswordReset, isRole(2), periodeController.periode);
router.post("/addPeriode", authenticateToken, isRole(2), periodeController.addPeriode);
router.post("/updatePeriode/:id", authenticateToken, isRole(2), periodeController.updatePeriode);
router.get("/deletePeriode/:id", authenticateToken, isRole(2), periodeController.deletePeriode);

/* records routes - Permission 1: Penilaian Kinerja */
router.get("/data", authenticateToken, checkPasswordReset, isRole(1), recordsController.records);
router.post("/addRecordTask/:id", authenticateToken, isRole(1), recordsController.addRecords);
router.post('/filterRecords', authenticateToken, isRole(1), recordsController.filterRecords);

/* refresh token route */
router.get('/auth/refresh-token', refreshToken);

/* current user route */
router.get('/users/current-user', authenticateToken, async (req, res) => {
    const User = require('../models/User');
    try {
        const user = await User.query().findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ email: user.email });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/dashboard', mainController.dashboard);

router.use(errorController.error404);

module.exports = router;
