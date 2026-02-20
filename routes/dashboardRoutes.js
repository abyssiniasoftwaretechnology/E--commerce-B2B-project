const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../controllers/dashboardController");
const { userAuth } = require("../middleware/auth");

// GET /dashboard - return aggregated dashboard statistics (protected)
router.get("/",  getDashboardStats);

module.exports = router;
