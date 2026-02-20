const Item = require("../models/item");
const Category = require("../models/category");
const SubCategory = require("../models/subCategory");
const { Op } = require("sequelize");


// Create a new item
exports.createItem = async (req, res) => {
  try {
    const {
      name,
      description,
      categoryId,
      subCategoryId,
      quantity,
      minQuantity,
      featured = false,
      featuredUntil, // now a date from request
      status = "active",
    } = req.body;

    // ✅ Required fields validation
    if (!name || !categoryId || !quantity || !minQuantity) {
      return res.status(400).json({
        message: "Name, categoryId, quantity and minQuantity are required",
      });
    }

    // ✅ Validate category
    const category = await Category.findByPk(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // ✅ Validate subCategory if provided
    if (subCategoryId) {
      const subCategory = await SubCategory.findByPk(subCategoryId);
      if (!subCategory) return res.status(404).json({ message: "SubCategory not found" });
    }

    // ✅ Ensure featuredUntil is null if featured is false
    const featuredUntilDate = featured ? new Date(featuredUntil) : null;

    const item = await Item.create({
      name,
      description,
      categoryId,
      subCategoryId: subCategoryId || null,
      quantity,
      minQuantity,
      featured,
      featuredUntil: featuredUntilDate,
      status,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating item", error: error.message });
  }
};

// Get all items with category & subcategory info
exports.getItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      attributes: { exclude: ["createdAt", "updatedAt", "categoryId", "subCategoryId"] },
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: SubCategory, attributes: ["id", "name"] },
      ],
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Error fetching items", error: error.message });
  }
};

// Get a single item by ID
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findByPk(id, {
      attributes: { exclude: ["createdAt", "updatedAt", "categoryId", "subCategoryId"] },
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: SubCategory, attributes: ["id", "name"] },
      ],
    });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Error fetching item", error: error.message });
  }
};

// Update item by ID
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      categoryId,
      subCategoryId,
      quantity,
      minQuantity,
      featured,
      featuredUntil, // now accept date directly from request
      status,
    } = req.body;

    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // ✅ Validate category if updated
    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) return res.status(404).json({ message: "Category not found" });
      item.categoryId = categoryId;
    }

    // ✅ Validate subCategory if updated
    if (subCategoryId) {
      const subCategory = await SubCategory.findByPk(subCategoryId);
      if (!subCategory) return res.status(404).json({ message: "SubCategory not found" });
      item.subCategoryId = subCategoryId;
    }

    // ✅ Update basic fields
    if (name) item.name = name;
    if (description !== undefined) item.description = description;
    if (quantity !== undefined) item.quantity = quantity;
    if (minQuantity !== undefined) item.minQuantity = minQuantity;
    if (status) item.status = status;

    // 🔹 Update featured logic
    if (featured !== undefined) item.featured = featured;

    if (featured) {
      // Use featuredUntil date from request, UTC-safe
      item.featuredUntil = featuredUntil ? new Date(featuredUntil) : null;
    } else {
      item.featuredUntil = null; // not featured
    }

    await item.save();
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating item", error: error.message });
  }
};

// Delete item by ID
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    await item.destroy();
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item", error: error.message });
  }
};

exports.filterItems = async (req, res) => {
  try {
    const { status, categoryId, subCategoryId, featured } = req.query;

    const whereClause = {};

    // 🔹 Filter by status
    if (status) {
      whereClause.status = status;
    }

    // 🔹 Filter by category
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    // 🔹 Filter by subCategory
    if (subCategoryId) {
      whereClause.subCategoryId = subCategoryId;
    }

    // 🔹 Filter by featured
    if (featured !== undefined) {
      const isFeatured = featured === "true";

      if (isFeatured) {
        // Only items still within featured period
        whereClause.featured = true;
        whereClause.featuredUntil = {
          [Op.gt]: new Date(),
        };
      } else {
        // Non-featured OR expired featured
        whereClause[Op.or] = [
          { featured: false },
          { featuredUntil: { [Op.lte]: new Date() } },
        ];
      }
    }

    const items = await Item.findAll({
      where: whereClause,
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: SubCategory, attributes: ["id", "name"] },
      ],
    });

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching items",
      error: error.message,
    });
  }
};
