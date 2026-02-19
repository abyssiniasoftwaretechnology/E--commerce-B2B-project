const express = require("express");
const router = express.Router();
const salesRequestController = require("../controllers/salesRequestController");
const upload = require("../middleware/uploads");

router.post(
  "/",
  upload.array("images", 5),
  salesRequestController.createSalesRequest,
);
router.get("/filter", salesRequestController.filterSalesRequests);
router.get("/", salesRequestController.getAllSalesRequests);
router.get("/:id", salesRequestController.getSalesRequestById);
router.put("/:id", upload.array("images", 5),salesRequestController.updateSalesRequest,);
router.patch("/:id/status", salesRequestController.updateSalesRequestStatus);
router.delete("/:id", salesRequestController.deleteSalesRequest);

module.exports = router;
