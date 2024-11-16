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

const { isLogin } = require("../middleware/authMidleware");

router.get("/", isLogin, mainController.main);

router.get("/login", authController.login);
router.post("/login", authController.loginPost);

router.get("/register", authController.register);
router.post("/register", authController.registerPost);

router.get("/staff", isLogin, staffController.staff);
router.post("/addStaff", isLogin, staffController.addStaff);
router.post("/updateStaff/:id", isLogin, staffController.updateStaff);
router.get("/deleteStaff/:id", isLogin, staffController.deleteStaff);

router.get("/addTask/:id", isLogin, taskController.task);
router.post("/addTask", isLogin, taskController.addTask);
router.post("/updateTask/:id", isLogin, taskController.updateTask);
router.get("/deleteTask/:id/:staffId", isLogin, taskController.deleteTask);

router.get("/periode", isLogin, periodeController.periode);
router.post("/addPeriode", isLogin, periodeController.addPeriode);
router.post("/updatePeriode/:id", isLogin, periodeController.updatePeriode);
router.get("/deletePeriode/:id", isLogin, periodeController.deletePeriode);

router.get("/data", isLogin, recordsController.data);
router.post("/addRecordTask/:id", isLogin, recordsController.addData);

router.get("/settings", isLogin, settingsController.settings);

module.exports = router;
