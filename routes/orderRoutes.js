const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const {customerAuth, userAuth} = require("../middleware/auth");




router.post("/", orderController.createOrder);
router.get("/filter", orderController.getFilteredOrders);
router.get("/my-orders", customerAuth, orderController.getMyOrders);
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);
router.put("/:id", orderController.updateOrder);
router.patch("/:id/status", userAuth, orderController.updateOrderStatus);
router.delete("/:id", orderController.deleteOrder);


module.exports = router;
