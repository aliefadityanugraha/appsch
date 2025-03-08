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

const apiController = require("../controllers/apiController");

const errorController = require("../controllers/errorController");

const {isLogin, authenticateToken} = require("../middleware/authMidleware");
const {refreshToken} = require("../controllers/authController");

/* main route */
router.get("/", authenticateToken, mainController.main);

/* auth route */
router.get("/auth/login", authController.login);
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

/* refresh token route */
router.get('/auth/refresh-token', refreshToken);

/* error handler route*/
router.get("/*", errorController.error404);

module.exports = router;
