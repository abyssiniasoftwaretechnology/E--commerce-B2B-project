
const express = require("express");
const router = express.Router();


router.use("/customers", require("./customerRoutes"));
router.use("/paymentMethods", require("./paymentMethodRoutes"));
router.use("/salesRequests", require("./salesRequestRouter"));
router.use("/orders", require("./orderRouter"));
router.use("/sales", require("./salesRouter"));


router.use("/users", require("./userRoutes"));
router.use("/categories", require("./categoryRoutes"));
router.use("/subcategories", require("./subCategoryRoutes"));
router.use("/items", require("./itemRoutes"));
router.use("/posts", require("./postRoutes"));

module.exports = router;