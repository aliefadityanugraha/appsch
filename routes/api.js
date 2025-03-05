const express = require("express");
const router = express.Router();

const apiController = require("../controllers/apiController");

router.get("/api-test", apiController.apiTest);

module.exports = router;
