const Order = require("../models/order");
const Customer = require("../models/customer");
const Post = require("../models/post");
const Item = require("../models/item");
const Category = require("../models/category");
const SubCategory = require("../models/subCategory");
const PaymentMethod = require("../models/paymentMethod");
const { Op } = require("sequelize");


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
        message:
          "customerId, postId, quantity, paymentMethodId, and offeredPrice are required",
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

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      attributes: {
        exclude: ["paymentMethodId", "updatedAt", "postId", "customerId"],
      },
      include: [
        {
          model: Customer,
          attributes: {
            exclude: [
              "phone",
              "password",
              "createdAt",
              "updatedAt",
              "tin",
              "legalDoc",
              "licenseNo",
              "type",
              "status",
            ],
          },
        },
        {
          model: Post,
          attributes: { exclude: ["updatedAt", "itemId", "pricing", "images"] },
        },
        {
          model: PaymentMethod,
          attributes: { exclude: ["createdAt", "updatedAt", "status"] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get All Orders Error:", error);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      attributes: {
        exclude: ["paymentMethodId", "updatedAt", "postId", "customerId"],
      },
      include: [
        {
          model: Customer,
          attributes: {
            exclude: [
              "phone",
              "password",
              "createdAt",
              "updatedAt",
              "tin",
              "legalDoc",
              "licenseNo",
              "type",
              "status",
            ],
          },
        },
        {
          model: Post,
          attributes: { exclude: ["updatedAt", "itemId", "pricing", "images"] },
        },
        {
          model: PaymentMethod,
          attributes: { exclude: ["createdAt", "updatedAt", "status"] },
        },
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
    const updatedOrder = await Order.findByPk(id, {
      attributes: { exclude: ["customerId", "postId", "paymentMethodId"] },
      include: [
        {
          model: Customer,
          attributes: {
            exclude: [
              "phone",
              "password",
              "createdAt",
              "updatedAt",
              "tin",
              "legalDoc",
              "licenseNo",
              "type",
              "status",
            ],
          },
        },
        {
          model: Post,
          attributes: { exclude: ["updatedAt", "itemId", "pricing", "images"] },
          include: [
            {
              model: Item,
              attributes: ["id", "name"],
              include: [
                { model: Category, attributes: ["id", "name"] },
                { model: SubCategory, attributes: ["id", "name"] },
              ],
            },
          ],
        },
        {
          model: PaymentMethod,
          attributes: ["id", "name", "status"],
        },
      ],
    });

    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Update Order Error:", error);
    return res.status(500).json({ message: "Failed to update order" });
  }
};

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

const parseDateUTC = (dateStr, endOfDay = false) => {
  // Expect dateStr in 'YYYY-MM-DD' format
  const [year, month, day] = dateStr.split("-").map(Number);

  if (endOfDay) {
    // Set to 23:59:59.999 UTC
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  }
  // Set to 00:00:00.000 UTC
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

exports.getFilteredOrders = async (req, res) => {
  try {
    // Extract filter parameters from query string
    const { customerId, postId, status, startDate, endDate } = req.query;

    // Build dynamic where clause
    const whereClause = {};
    if (customerId) whereClause.customerId = Number(customerId);
    if (postId) whereClause.postId = Number(postId);
    if (status) whereClause.status = status;

    // Add date range filter if both startDate and endDate are provided
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [parseDateUTC(startDate), parseDateUTC(endDate, true)],
      };
    } else if (startDate) {
      whereClause.createdAt = {
        [Op.gte]: parseDateUTC(startDate),
      };
    } else if (endDate) {
      whereClause.createdAt = {
        [Op.lte]: parseDateUTC(endDate, true),
      };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          attributes: {
            exclude: [
              "phone",
              "password",
              "createdAt",
              "updatedAt",
              "tin",
              "legalDoc",
              "licenseNo",
              "type",
              "status",
            ],
          },
        },
        {
          model: Post,
          attributes: { exclude: ["updatedAt", "itemId", "pricing", "images"] },
        },
        {
          model: PaymentMethod,
          attributes: { exclude: ["createdAt", "updatedAt", "status"] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Get Filtered Orders Error:", error);
    return res.status(500).json({ message: "Failed to fetch filtered orders" });
  }
};