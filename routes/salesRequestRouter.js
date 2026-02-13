const express = require("express");
const router = express.Router();
const salesRequestController = require("../controllers/salesRequestController");


router.post("/", salesRequestController.createSalesRequest);
router.get("/", salesRequestController.getAllSalesRequests);
router.get("/:id", salesRequestController.getSalesRequestById);
router.put("/:id", salesRequestController.updateSalesRequest);
router.patch("/:id/status", salesRequestController.updateSalesRequestStatus);
router.delete("/:id", salesRequestController.deleteSalesRequest);

module.exports = router;
