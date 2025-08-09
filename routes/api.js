const express = require("express");
const router = express.Router();

const apiController = require("../controllers/apiController");
const recordsController = require("../controllers/recordsController");
const taskController = require("../controllers/taskController");
const staffController = require("../controllers/staffController");
const healthRoutes = require("./health");
const { csrfProtectionAPI, getCSRFToken } = require("../middleware/csrfMiddleware");

// CSRF token endpoint for AJAX requests
router.get("/csrf-token", getCSRFToken);

// API routes (GET requests don't need CSRF protection)
router.get("/test", apiController.apiTest);
// router.get("/staff", staffController.getStaffAPI);
router.get("/records", recordsController.filterRecords);
router.get("/task/:id", taskController.getTasksByStaffId);
router.get("/records/:staffId", recordsController.getRecordsByStaffAndDate);

// POST/PUT/DELETE routes with CSRF protection
router.post("/records/:id", csrfProtectionAPI, recordsController.updateRecord);

// Health monitoring routes
router.use("/health", healthRoutes);

module.exports = router;
