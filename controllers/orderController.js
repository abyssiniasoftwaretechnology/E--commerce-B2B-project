const Order = require("../models/order");
const Customer = require("../models/customer");
const Post = require("../models/post");
const PaymentMethod = require("../models/paymentMethod");

/**
 * CREATE: Add a new Order
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      customerId,
      postId,
      quantity,
      paymentMethodId,
      offeredPrice,
      status, // optional, but we will ignore on create
    } = req.body;

    // Validate required fields
    if (
      !customerId ||
      !postId ||
      quantity === undefined ||
      !paymentMethodId ||
      !offeredPrice
    ) {
      return res.status(400).json({
        message: "customerId, postId, quantity, paymentMethodId, and offeredPrice are required",
      });
    }

    const order = await Order.create({
      customerId,
      postId,
      quantity,
      paymentMethodId,
      offeredPrice,
      status: undefined, // enforce default "pending"
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({ message: "Failed to create order" });
  }
};

/**
 * READ: Get all orders
 */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: Customer },
        { model: Post },
        { model: PaymentMethod },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get All Orders Error:", error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * READ: Get a single order by ID
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: Customer },
        { model: Post },
        { model: PaymentMethod },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Get Order Error:", error);
    return res.status(500).json({ message: "Failed to fetch order" });
  }
};

/**
 * UPDATE: Full update of Order
 */
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerId,
      postId,
      quantity,
      paymentMethodId,
      offeredPrice,
      status,
    } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await order.update({
      customerId: customerId ?? order.customerId,
      postId: postId ?? order.postId,
      quantity: quantity ?? order.quantity,
      paymentMethodId: paymentMethodId ?? order.paymentMethodId,
      offeredPrice: offeredPrice ?? order.offeredPrice,
      status: status ?? order.status,
    });

    return res.status(200).json(order);
  } catch (error) {
    console.error("Update Order Error:", error);
    return res.status(500).json({ message: "Failed to update order" });
  }
};

/**
 * PATCH: Update ONLY status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      message: "Status updated successfully",
      status: order.status,
    });
  } catch (error) {
    console.error("Patch Status Error:", error);
    return res.status(500).json({ message: "Failed to update status" });
  }
};

/**
 * DELETE: Remove an order
 */
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await order.destroy();
    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete Order Error:", error);
    return res.status(500).json({ message: "Failed to delete order" });
  }
};

exports.getFilteredOrders = async (req, res) => {
  try {
    // Extract filter parameters from query string
    const { customerId, postId, status } = req.query;

    // Build dynamic where clause
    const whereClause = {};
    if (customerId) whereClause.customerId = Number(customerId);
    if (postId) whereClause.postId = Number(postId);
    if (status) whereClause.status = status;

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: Customer },
        { model: Post },
        { model: PaymentMethod },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get Filtered Orders Error:", error);
    return res.status(500).json({ message: "Failed to fetch filtered orders" });
  }
};

exports.getFilteredOrders = async (req, res) => {
  try {
    const { customerId, postId, status } = req.query;

    const whereClause = {};
    if (customerId) whereClause.customerId = parseInt(customerId, 10);
    if (postId) whereClause.postId = parseInt(postId, 10);
    if (status) whereClause.status = status;

    console.log("Filter:", whereClause); // 🔹 Debug line

    const orders = await Order.findAll({
      where: whereClause,
      include: [Customer, Post, PaymentMethod],
      order: [["createdAt", "DESC"]],
    });

    console.log("Found orders:", orders.length); // 🔹 Debug line

    return res.status(200).json(orders); // always return array
  } catch (error) {
    console.error("Get Filtered Orders Error:", error);
    return res.status(500).json({ message: "Failed to fetch filtered orders" });
  }
};


