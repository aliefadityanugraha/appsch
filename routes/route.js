"use strict";

const express = require("express");
const router = express.Router();

const mainController = require("../controllers/mainController");
const staffController = require("../controllers/staffController");
const taskController = require("../controllers/taskController");
const recordsController = require("../controllers/recordsController");
const periodeController = require("../controllers/periodeController");

router.get("/", mainController.main);

router.get("/staff", staffController.staff);
router.post("/addStaff", staffController.addStaff);
router.post("/updateStaff/:id", staffController.updateStaff);
router.get("/deleteStaff/:id", staffController.deleteStaff);

router.get("/addTask/:id", taskController.task);
router.post("/addTask", taskController.addTask);
router.post("/updateTask/:id", taskController.updateTask);
router.get("/deleteTask/:id/:staffId", taskController.deleteTask);

router.get("/periode", periodeController.periode);
router.post("/addPeriode", periodeController.addPeriode);
router.post("/updatePeriode/:id", periodeController.updatePeriode);
router.get("/deletePeriode/:id", periodeController.deletePeriode);

router.get("/data", recordsController.data);
router.post("/addRecordTask/:id", recordsController.addData);

module.exports = router;
