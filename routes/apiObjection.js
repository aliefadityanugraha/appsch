const express = require("express");
const router = express.Router();

// Objection.js Controllers
const apiController = require("../controllers/apiControllerObjection");
const recordsController = require("../controllers/recordsControllerObjection");
const taskController = require("../controllers/taskControllerObjection");

router.get("/api-test", apiController.apiTest);
router.get("/records", recordsController.filterRecords);
router.get("/task/:id", taskController.getTasksByStaffId);
router.get("/records/:staffId", recordsController.getRecordsByStaffAndDate);
router.post("/records/:id", recordsController.updateRecord);

module.exports = router; 