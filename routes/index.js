
const express = require("express");
const router = express.Router();

router.use("/users", require("./userRoutes"));
router.use("/categories", require("./categoryRoutes"));
router.use("/subcategories", require("./subCategoryRoutes"));
router.use("/items", require("./itemRoutes"));
router.use("/posts", require("./postRoutes"));
module.exports = router;