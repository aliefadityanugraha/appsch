const express = require("express");
const router = express.Router();

const apiController = require("../controllers/apiController");
const recordsController = require("../controllers/recordsController");

router.get("/api-test", apiController.apiTest);
router.get("/records", recordsController.filterRecords);

module.exports = router;
