const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");


router.post("/", salesController.createSale);
router.get("/filter", salesController.filterSales);
router.get("/", salesController.getAllSales);
router.get("/:id", salesController.getSaleById);
router.put("/:id", salesController.updateSale);
router.patch("/:id/status", salesController.updateSaleStatus);
router.patch("/:id/payment-status", salesController.updateSalePaymentStatus);
router.patch("/:id/delivery-status", salesController.updateSaleDeliveryStatus);
router.delete("/:id", salesController.deleteSale);

module.exports = router;
