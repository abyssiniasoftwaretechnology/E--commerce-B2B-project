const {
  SalesRequest,
  Item,
  PaymentMethod,
  Category,
  SubCategory,
} = require("../models");
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const { Op } = require("sequelize");

exports.createSalesRequest = async (req, res) => {
  try {
    const { itemId, price, quantity, paymentMethodId, unit } = req.body;

    if (!itemId || !price || quantity === undefined || !paymentMethodId) {
      return res.status(400).json({
        message: "itemId, price, quantity, and paymentMethodId are required",
      });
    }

    // Map uploaded files to paths
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const salesRequest = await SalesRequest.create({
      itemId,
      price,
      quantity,
      paymentMethodId,
      unit,
      images,
    });

    return res.status(201).json(salesRequest);
  } catch (error) {
    console.error("Create SalesRequest Error:", error.message);
    return res.status(500).json({
      message: "Failed to create sales request",
      error: error.message,
    });
  }
};

exports.getAllSalesRequests = async (req, res) => {
  try {
    const salesRequests = await SalesRequest.findAll({
      attributes: { exclude: ["updatedAt", "itemId", "paymentMethodId"] },
      include: [
        {
          model: Item,
          attributes: {
            exclude: [
              "createdAt",
              "updatedAt",
              "categoryId",
              "subCategoryId",
              "status",
              "quantity",
              "minQuantity",
              "featured",
              "featuredUntil",
            ],
          },
          include: [
            {
              model: Category,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
            {
              model: SubCategory,
              attributes: { exclude: ["createdAt", "updatedAt", "categoryId"] },
            },
          ],
        },
        {
          model: PaymentMethod,
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formatted = salesRequests.map((sale) => {
      const saleData = sale.toJSON();

      // Ensure images is always an array
      let imagesArray = [];
      if (Array.isArray(saleData.images)) {
        imagesArray = saleData.images;
      } else if (typeof saleData.images === "string") {
        try {
          imagesArray = JSON.parse(saleData.images);
        } catch (err) {
          imagesArray = [];
        }
      }

      return {
        ...saleData,
        images: imagesArray.map((img) => `${BASE_URL}${img}`),
      };
    });

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("Get All SalesRequests Error:", error);
    return res.status(500).json({ message: "Failed to fetch sales requests" });
  }
};

exports.getSalesRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const salesRequest = await SalesRequest.findByPk(id, {
      attributes: { exclude: ["updatedAt", "itemId", "paymentMethodId"] },
      include: [
        {
          model: Item,
          attributes: ["id", "name", "description", "images"],
          attributes: {
            exclude: [
              "createdAt",
              "updatedAt",
              "categoryId",
              "subCategoryId",
              "status",
              "quantity",
              "minQuantity",
              "featured",
              "featuredUntil",
            ],
          },
          include: [
            {
              model: Category,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
            {
              model: SubCategory,
              attributes: { exclude: ["createdAt", "updatedAt", "categoryId"] },
            },
          ],
        },
        {
          model: PaymentMethod,
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
      ],
    });

    if (!salesRequest) {
      return res.status(404).json({ message: "Sales request not found" });
    }

    const saleData = salesRequest.toJSON();

    // Ensure images is always an array
    let imagesArray = [];
    if (Array.isArray(saleData.images)) {
      imagesArray = saleData.images;
    } else if (typeof saleData.images === "string") {
      try {
        imagesArray = JSON.parse(saleData.images);
      } catch (err) {
        imagesArray = [];
      }
    }

    // Prepend BASE_URL
    saleData.images = imagesArray.map((img) => `${BASE_URL}${img}`);

    return res.status(200).json(saleData);
  } catch (error) {
    console.error("Get SalesRequest Error:", error);
    return res.status(500).json({ message: "Failed to fetch sales request" });
  }
};

exports.updateSalesRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      itemId,
      price,
      quantity,
      paymentMethodId,
      unit,
      removeImages,
    } = req.body;

    const salesRequest = await SalesRequest.findByPk(id);
    if (!salesRequest) {
      return res.status(404).json({ message: "Sales request not found" });
    }

    // ✅ 1. Convert existing images to array safely
    let updatedImages = [];

    if (Array.isArray(salesRequest.images)) {
      updatedImages = salesRequest.images;
    } else if (typeof salesRequest.images === "string") {
      try {
        updatedImages = JSON.parse(salesRequest.images);
      } catch {
        updatedImages = [];
      }
    }

    // ✅ 2. Remove images if provided
    if (removeImages) {
      let imagesToRemove = [];

      try {
        imagesToRemove =
          typeof removeImages === "string"
            ? JSON.parse(removeImages)
            : removeImages;
      } catch {
        imagesToRemove = [];
      }

      updatedImages = updatedImages.filter(
        (img) => !imagesToRemove.includes(img)
      );
    }

    // ✅ 3. Append new uploaded images (DO NOT REPLACE)
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(
        (file) => `/uploads/${file.filename}`
      );

      updatedImages = [...updatedImages, ...newImages];
    }

    // ✅ 4. Update DB
    await salesRequest.update({
      itemId: itemId ?? salesRequest.itemId,
      price: price ?? salesRequest.price,
      quantity: quantity ?? salesRequest.quantity,
      paymentMethodId: paymentMethodId ?? salesRequest.paymentMethodId,
      unit: unit ?? salesRequest.unit,
      images: updatedImages,
    });

    // ✅ 5. Refetch (same as your working version)
    const updatedSale = await SalesRequest.findByPk(id, {
      attributes: { exclude: ["updatedAt", "itemId", "paymentMethodId"] },
      include: [
        {
          model: Item,
          attributes: {
            exclude: [
              "createdAt",
              "updatedAt",
              "categoryId",
              "subCategoryId",
              "status",
              "quantity",
              "minQuantity",
              "featured",
              "featuredUntil",
            ],
          },
          include: [
            { model: Category, attributes: { exclude: ["createdAt", "updatedAt"] } },
            { model: SubCategory, attributes: { exclude: ["createdAt", "updatedAt", "categoryId"] } },
          ],
        },
        { model: PaymentMethod, attributes: { exclude: ["createdAt", "updatedAt"] } },
      ],
    });

    const saleData = updatedSale.toJSON();

    // ✅ 6. Format images with BASE_URL (same as yours)
    let imagesArray = [];
    if (Array.isArray(saleData.images)) {
      imagesArray = saleData.images;
    } else if (typeof saleData.images === "string") {
      try {
        imagesArray = JSON.parse(saleData.images);
      } catch {
        imagesArray = [];
      }
    }

    saleData.images = imagesArray.map((img) => `${BASE_URL}${img}`);

    return res.status(200).json(saleData);

  } catch (error) {
    console.error("Update SalesRequest Error:", error.message);
    return res.status(500).json({
      message: "Failed to update sales request",
      error: error.message,
    });
  }
};

exports.updateSalesRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const salesRequest = await SalesRequest.findByPk(id);
    if (!salesRequest) {
      return res.status(404).json({ message: "Sales request not found" });
    }

    salesRequest.status = status;
    await salesRequest.save();

    return res.status(200).json({
      message: "Status updated successfully",
      status: salesRequest.status,
    });
  } catch (error) {
    console.error("Patch Status Error:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

exports.deleteSalesRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const salesRequest = await SalesRequest.findByPk(id);
    if (!salesRequest) {
      return res.status(404).json({ message: "Sales request not found" });
    }

    await salesRequest.destroy();
    return res
      .status(200)
      .json({ message: "Sales request deleted successfully" });
  } catch (error) {
    console.error("Delete SalesRequest Error:", error);
    return res.status(500).json({ message: "Failed to delete sales request" });
  }
};

exports.filterSalesRequests = async (req, res) => {
  try {
    const { itemId, paymentMethodId, status } = req.query;

    // 1️⃣ Build dynamic where condition
    const whereCondition = {};

    if (itemId) {
      whereCondition.itemId = itemId;
    }

    if (paymentMethodId) {
      whereCondition.paymentMethodId = paymentMethodId;
    }

    if (status) {
      whereCondition.status = status;
    }

    // 2️⃣ Fetch filtered sales requests
    const salesRequests = await SalesRequest.findAll({
      where: whereCondition,
      attributes: { exclude: ["updatedAt", "itemId", "paymentMethodId"] },
      include: [
        {
          model: Item,
          attributes: {
            exclude: [
              "createdAt",
              "updatedAt",
              "categoryId",
              "subCategoryId",
              "status",
              "quantity",
              "minQuantity",
              "featured",
              "featuredUntil",
            ],
          },
          include: [
            { model: Category, attributes: { exclude: ["createdAt", "updatedAt"] } },
            { model: SubCategory, attributes: { exclude: ["createdAt", "updatedAt", "categoryId"] } },
          ],
        },
        { model: PaymentMethod, attributes: { exclude: ["createdAt", "updatedAt"] } },
      ],
      order: [["createdAt", "DESC"]],
    });

    // 3️⃣ Format images with BASE_URL
    const formattedData = salesRequests.map((sale) => {
      const saleData = sale.toJSON();

      let imagesArray = [];

      if (Array.isArray(saleData.images)) {
        imagesArray = saleData.images;
      } else if (typeof saleData.images === "string") {
        try {
          imagesArray = JSON.parse(saleData.images);
        } catch {
          imagesArray = [];
        }
      }

      saleData.images = imagesArray.map((img) => `${BASE_URL}${img}`);

      return saleData;
    });

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error("Filter SalesRequests Error:", error.message);
    return res.status(500).json({
      message: "Failed to filter sales requests",
      error: error.message,
    });
  }
};
