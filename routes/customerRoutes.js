const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const {customerAuth, userAuth} = require("../middleware/auth");
const upload = require("../middleware/uploads");
// Public routes


router.post("/register", upload.array("legalDoc", 5), customerController.registerCustomer);
router.post("/login", customerController.loginCustomer);
router.post("/logout", customerAuth, customerController.logoutCustomer);

// Protected routes
router.get("/",  customerController.getCustomers);
router.get("/:id", customerAuth, customerController.getCustomerById);
router.put("/:id", upload.array("legalDoc", 5), customerController.updateCustomer);
router.delete("/:id", userAuth, customerController.deleteCustomer);
router.patch("/:id/status", userAuth, customerController.updateCustomerStatus);
module.exports = router;
