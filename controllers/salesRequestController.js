const { Item, PaymentMethod, SalesRequest } = require("../models");

/**
 * CREATE: Add a new sales request
 */
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
      unit: unit ?? "",
      images, // now stores array of file paths
      // status will default to "pending"
    });

    return res.status(201).json(salesRequest);
  } catch (error) {
    console.error("Create SalesRequest Error:", error.message);
    return res
      .status(500)
      .json({
        message: "Failed to create sales request",
        error: error.message,
      });
  }
};

/**
 * READ: Get all sales requests
 */
exports.getAllSalesRequests = async (req, res) => {
  try {
    const salesRequests = await SalesRequest.findAll({
      include: [{ model: Item }, { model: PaymentMethod }],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(salesRequests);
  } catch (error) {
    console.error("Get All SalesRequests Error:", error);
    return res.status(500).json({ message: "Failed to fetch sales requests" });
  }
};

/**
 * READ: Get a single sales request by ID
 */
exports.getSalesRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const salesRequest = await SalesRequest.findByPk(id, {
      include: [{ model: Item }, { model: PaymentMethod }],
    });

    if (!salesRequest) {
      return res.status(404).json({ message: "Sales request not found" });
    }

    return res.status(200).json(salesRequest);
  } catch (error) {
    console.error("Get SalesRequest Error:", error);
    return res.status(500).json({ message: "Failed to fetch sales request" });
  }
};

/**
 * UPDATE: Full update of sales request
 */
exports.updateSalesRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      itemId,
      price,
      quantity,
      paymentMethodId,
      unit,
    } = req.body;

    const salesRequest = await SalesRequest.findByPk(id);
    if (!salesRequest) {
      return res.status(404).json({ message: "Sales request not found" });
    }

    // Handle uploaded images if any
    let updatedImages = salesRequest.images; // default to existing images
    if (req.files && req.files.length > 0) {
      // Map uploaded files to paths
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      // Optional: combine old and new images or replace
      updatedImages = newImages; // replace existing images
    }

    // Update only fields provided in form-data
    await salesRequest.update({
      itemId: itemId ?? salesRequest.itemId,
      price: price ?? salesRequest.price,
      quantity: quantity ?? salesRequest.quantity,
      paymentMethodId: paymentMethodId ?? salesRequest.paymentMethodId,
      unit: unit ?? salesRequest.unit,
      images: updatedImages,
      // status is NOT updated
    });

    return res.status(200).json(salesRequest);
  } catch (error) {
    console.error("Update SalesRequest Error:", error.message);
    return res.status(500).json({ message: "Failed to update sales request", error: error.message });
  }
};


/**
 * PATCH: Update ONLY the status
 */
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

/**
 * DELETE: Remove a sales request
 */
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
