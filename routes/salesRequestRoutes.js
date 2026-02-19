const express = require("express");
const router = express.Router();
const salesRequestController = require("../controllers/salesRequestController");
const {customerAuth, userAuth, userOrCustomerAuth} = require("../middleware/auth");
const upload = require("../middleware/uploads");

router.post(
  "/", 
  upload.array("images", 5),
  customerAuth,
  salesRequestController.createSalesRequest,
);
router.get("/filter", salesRequestController.filterSalesRequests);
router.get("/my-sales-requests", customerAuth, salesRequestController.getMySalesRequests);
router.get("/", userAuth, salesRequestController.getAllSalesRequests);
router.get("/:id", salesRequestController.getSalesRequestById);
router.put("/:id", upload.array("images", 5),customerAuth, salesRequestController.updateSalesRequest,);
router.patch("/:id/status", userAuth, salesRequestController.updateSalesRequestStatus);
router.delete("/:id", salesRequestController.deleteSalesRequest);

module.exports = router;
