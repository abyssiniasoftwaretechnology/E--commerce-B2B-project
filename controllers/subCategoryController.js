const SubCategory = require("../models/subCategory");
const Category = require("../models/category");

// Create a new subcategory
exports.createSubCategory = async (req, res) => {
  try {
    const { name, categoryId } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ message: "Name and categoryId are required" });
    }

    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Optional: prevent duplicate subcategories under same category
    const existing = await SubCategory.findOne({ where: { name, categoryId } });
    if (existing) return res.status(409).json({ message: "SubCategory already exists in this category" });

    const subCategory = await SubCategory.create({ name, categoryId });
    res.status(201).json(subCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating subcategory", error: error.message });
  }
};

// Get all subcategories (with category info)
exports.getSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.findAll({
      include: [{ model: Category, attributes: ["id", "name"] }],
    });
    res.json(subCategories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subcategories", error: error.message });
  }
};

// Get a single subcategory by ID
exports.getSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const subCategory = await SubCategory.findByPk(id, {
      include: [{ model: Category, attributes: ["id", "name"] }],
    });
    if (!subCategory) return res.status(404).json({ message: "SubCategory not found" });
    res.json(subCategory);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subcategory", error: error.message });
  }
};

// Update subcategory by ID
exports.updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId } = req.body;

    const subCategory = await SubCategory.findByPk(id);
    if (!subCategory) return res.status(404).json({ message: "SubCategory not found" });

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) return res.status(404).json({ message: "Category not found" });
      subCategory.categoryId = categoryId;
    }

    if (name) subCategory.name = name;

    await subCategory.save();
    res.json(subCategory);
  } catch (error) {
    res.status(500).json({ message: "Error updating subcategory", error: error.message });
  }
};

// Delete subcategory by ID
exports.deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const subCategory = await SubCategory.findByPk(id);
    if (!subCategory) return res.status(404).json({ message: "SubCategory not found" });

    await subCategory.destroy();
    res.json({ message: "SubCategory deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting subcategory", error: error.message });
  }
};
