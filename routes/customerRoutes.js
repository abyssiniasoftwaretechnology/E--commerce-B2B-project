const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const authMiddleware = require("../config/authMiddleware");

// Public routes
router.post("/register", customerController.registerCustomer);
router.post("/login", customerController.loginCustomer);
router.post("/logout", authMiddleware, customerController.logoutCustomer);

// Protected routes
router.get("/", authMiddleware, customerController.getCustomers);
router.get("/:id", authMiddleware, customerController.getCustomerById);
router.put("/:id", authMiddleware, customerController.updateCustomer);
router.delete("/:id", authMiddleware, customerController.deleteCustomer);
router.patch("/:id/status", authMiddleware, customerController.updateCustomerStatus);
module.exports = router;
