"use strict";

const express = require("express");
const router = express.Router();

// Objection.js Controllers
const mainController = require("../controllers/mainControllerObjection");
const staffController = require("../controllers/staffControllerObjection");
const taskController = require("../controllers/taskControllerObjection");
const recordsController = require("../controllers/recordsControllerObjection");
const periodeController = require("../controllers/periodeControllerObjection");
const settingsController = require("../controllers/settingControllerObjection");
const authController = require("../controllers/authControllerObjection");
const roleController = require("../controllers/roleControllerObjection");

const apiController = require("../controllers/apiControllerObjection");

const errorController = require("../controllers/errorController");

const {isLogin, authenticateToken} = require("../middleware/authMidleware");
const {refreshToken} = require("../controllers/authControllerObjection");

/* main route */
router.get("/", authenticateToken, mainController.dashboard);

/* auth route */
router.get("/auth/login", isLogin, authController.login);
router.post("/auth/login", authController.loginPost);

router.get("/auth/register", authController.register);
router.post("/auth/register", authController.registerPost);

router.get("/logout", authController.logout);

/* staff route */
router.get("/staff", authenticateToken, staffController.staff);
router.post("/addStaff", authenticateToken, staffController.addStaff);
router.post("/updateStaff/:id", authenticateToken, staffController.updateStaff);
router.get("/deleteStaff/:id", authenticateToken, staffController.deleteStaff);

/* task route */
router.get("/addTask/:id", authenticateToken, taskController.task);
router.post("/addTask", authenticateToken, taskController.addTask);
router.post("/updateTask/:id", authenticateToken, taskController.updateTask);
router.get("/deleteTask/:id/:staffId", authenticateToken, taskController.deleteTask);

/* periode route */
router.get("/periode", authenticateToken, periodeController.periode);
router.post("/addPeriode", authenticateToken, periodeController.addPeriode);
router.post("/updatePeriode/:id", authenticateToken, periodeController.updatePeriode);
router.get("/deletePeriode/:id", authenticateToken, periodeController.deletePeriode);

/* records route */
router.get("/data", authenticateToken, recordsController.records);
router.post("/addRecordTask/:id", authenticateToken, recordsController.addRecords);
router.post('/filterRecords', authenticateToken, recordsController.filterRecords);

/* settings route */
router.get("/settings", authenticateToken, settingsController.settings);

/* roles route */
router.get("/roles", authenticateToken, roleController.roles);
router.post("/insertRole", authenticateToken, roleController.insertRole);

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

router.use(errorController.error404);

module.exports = router; 