const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/uploads");
// Public routes


router.post("/register", upload.array("legalDocs", 5), customerController.registerCustomer);
router.post("/login", customerController.loginCustomer);
router.post("/logout", authMiddleware, customerController.logoutCustomer);

// Protected routes
router.get("/", authMiddleware, customerController.getCustomers);
router.get("/:id", authMiddleware, customerController.getCustomerById);
router.put("/:id", upload.array("legalDocs", 5), customerController.updateCustomer);
router.delete("/:id", authMiddleware, customerController.deleteCustomer);
router.patch("/:id/status", authMiddleware, customerController.updateCustomerStatus);
module.exports = router;
