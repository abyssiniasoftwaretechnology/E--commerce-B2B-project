const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");

// CRUD endpoints
router.post("/", categoryController.createCategory);      // Create
router.get("/", categoryController.getCategories);       // Read all
router.get("/:id", categoryController.getCategoryById);  // Read one
router.put("/:id", categoryController.updateCategory);   // Update
router.delete("/:id", categoryController.deleteCategory);// Delete

module.exports = router;
