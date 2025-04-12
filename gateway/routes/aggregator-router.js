const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth-middleware");
const { getHomeData } = require("../controllers/aggregator-controller");

router.get("/data", authenticateToken, getHomeData);

module.exports = router;
