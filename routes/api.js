const express = require("express");
const router = express.Router();

const apiController = require("../controllers/apiController");
const recordsController = require("../controllers/recordsController");
const taskController = require("../controllers/taskController");

router.get("/api-test", apiController.apiTest);
router.get("/records", recordsController.filterRecords);
router.get("/task/:id", taskController.getTasksByStaffId);
router.get("/records/:staffId", recordsController.getRecordsByStaffAndDate);
router.post("/records/:id", recordsController.updateRecord);

module.exports = router;
