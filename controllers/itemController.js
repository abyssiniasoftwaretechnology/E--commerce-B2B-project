const Item = require("../models/item");
const Category = require("../models/category");
const SubCategory = require("../models/subCategory");

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
      featured,
      featuredDuration,
      status,
    } = req.body;

    if (!name || !categoryId || !quantity || !minQuantity) {
      return res.status(400).json({ message: "Name, categoryId, quantity and minQuantity are required" });
    }

    const category = await Category.findByPk(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (subCategoryId) {
      const subCategory = await SubCategory.findByPk(subCategoryId);
      if (!subCategory) return res.status(404).json({ message: "SubCategory not found" });
    }

    const item = await Item.create({
      name,
      description,
      categoryId,
      subCategoryId: subCategoryId || null,
      quantity,
      minQuantity,
      featured: featured || false,
      featuredDuration: featuredDuration || null,
      status: status || "active",
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
      featuredDuration,
      status,
    } = req.body;

    const item = await Item.findByPk(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) return res.status(404).json({ message: "Category not found" });
      item.categoryId = categoryId;
    }

    if (subCategoryId) {
      const subCategory = await SubCategory.findByPk(subCategoryId);
      if (!subCategory) return res.status(404).json({ message: "SubCategory not found" });
      item.subCategoryId = subCategoryId;
    }

    if (name) item.name = name;
    if (description !== undefined) item.description = description;
    if (quantity !== undefined) item.quantity = quantity;
    if (minQuantity !== undefined) item.minQuantity = minQuantity;
    if (featured !== undefined) item.featured = featured;
    if (featuredDuration !== undefined) item.featuredDuration = featuredDuration;
    if (status) item.status = status;

    await item.save();
    res.json(item);
  } catch (error) {
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
