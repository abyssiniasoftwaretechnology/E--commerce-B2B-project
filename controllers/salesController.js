// const Sales = require("../models/Sales");
// const Order = require("../models/order");
// const Customer = require("../models/customer");
// const Item = require("../models/item");
// const Post = require("../models/post");
const { Sales, Order, Post, Item, Customer } = require("../models");

/**
 * CREATE: Add a new Sale
 */
exports.createSale = async (req, res) => {
  try {
    const { orderId, customerId, price, totalPrice, paidAmount, status, paymentStatus, deliveryStatus } = req.body;

    if (!orderId || !price || !totalPrice) {
      return res.status(400).json({
        message: "orderId, price, and totalPrice are required",
      });
    }

    const sale = await Sales.create({
      orderId,
      customerId,
      price,
      totalPrice,
      paidAmount: paidAmount ?? 0,
      status: status ?? "pending",
      paymentStatus: paymentStatus ?? "unpaid",
      deliveryStatus: deliveryStatus ?? "pending",
    });

    return res.status(201).json(sale);
  } catch (error) {
    console.error("Create Sale Error:", error);
    return res.status(500).json({ message: "Failed to create sale" });
  }
};

/**
 * READ: Get all Sales
 */
exports.getAllSales = async (req, res) => {
  try {
    const sales = await Sales.findAll({
      attributes: { exclude: ["updatedAt", "orderId"] },
      include: [
        { 
          model: Order,
          attributes: { exclude: ["updatedAt", "customerId", "postId", "paymentMethodId"] },
          include: [
            { 
              model: Post, 
              attributes: { exclude: ["updatedAt", "itemId"] }, 
              include: [Item] 
            },
            { 
              model: Customer, 
              attributes: { exclude: ["updatedAt", "password", "licenseNo","legalDoc"] } 
            },
          ]
        },
        { 
          model: Customer, 
          attributes: { exclude: ["updatedAt", "password", "licenseNo","legalDoc"] } 
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // 🔥 Transform data here
    const formattedSales = sales.map(sale => {
      const saleJSON = sale.toJSON();

      if (saleJSON.Order?.Post) {
        // Parse images
        if (saleJSON.Order.Post.images) {
          saleJSON.Order.Post.images = JSON.parse(saleJSON.Order.Post.images)
            .map(img => `${process.env.BASE_URL}/uploads/${img}`);
        }

        // Parse pricing
        if (saleJSON.Order.Post.pricing) {
          saleJSON.Order.Post.pricing = JSON.parse(saleJSON.Order.Post.pricing);
        }
      }

      return saleJSON;
    });

    return res.status(200).json(formattedSales);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch sales" });
  }
};


/**
 * READ: Get a single Sale by ID
 */
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sales.findByPk(id, {
      include: [
        { model: Order },
        { model: Customer },
      ],
    });

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    return res.status(200).json(sale);
  } catch (error) {
    console.error("Get Sale Error:", error);
    return res.status(500).json({ message: "Failed to fetch sale" });
  }
};

/**
 * UPDATE: Full update of Sale
 */
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sales.findByPk(id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    const { orderId, customerId, price, totalPrice, paidAmount,  } = req.body;

    await sale.update({
      orderId: orderId ?? sale.orderId,
      customerId: customerId ?? sale.customerId,
      price: price ?? sale.price,
      totalPrice: totalPrice ?? sale.totalPrice,
      paidAmount: paidAmount ?? sale.paidAmount,
      // status: status ?? sale.status,
      // paymentStatus: paymentStatus ?? sale.paymentStatus,
      // deliveryStatus: deliveryStatus ?? sale.deliveryStatus,
    });

    return res.status(200).json(sale);
  } catch (error) {
    console.error("Update Sale Error:", error);
    return res.status(500).json({ message: "Failed to update sale" });
  }
};

/**
 * PATCH: Update status
 * If status is 'sold', subtract quantity from associated item
 */
exports.updateSaleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "sold", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const sale = await Sales.findByPk(id, {
      include: [
        { model: Order, include: [{ model: Post, include: [Item] }] }
      ]
    });

    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // Only adjust Item quantity if status becomes "sold"
    if (status === "sold" && sale.status !== "sold") {
      const order = sale.Order;
      if (!order) return res.status(400).json({ message: "Order not found" });

      const post = order.Post;
      if (!post || !post.Item) return res.status(404).json({ message: "Item not found" });

      const item = post.Item;

      if (item.quantity < order.quantity) {
        return res.status(400).json({ message: "Not enough item quantity in stock" });
      }

      item.quantity -= order.quantity;
      await item.save();
    }

    sale.status = status;
    await sale.save();

    return res.status(200).json({ message: "Sale status updated", status: sale.status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update sale status" });
  }
};

/**
 * PATCH: Update paymentStatus only
 */
exports.updateSalePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!["unpaid", "partial", "paid"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const sale = await Sales.findByPk(id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    sale.paymentStatus = paymentStatus;
    await sale.save();

    return res.status(200).json({ message: "Payment status updated", paymentStatus: sale.paymentStatus });
  } catch (error) {
    console.error("Patch Payment Status Error:", error);
    return res.status(500).json({ message: "Failed to update payment status" });
  }
};

/**
 * PATCH: Update deliveryStatus only
 */
exports.updateSaleDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStatus } = req.body;

    if (!["pending", "shipped", "delivered"].includes(deliveryStatus)) {
      return res.status(400).json({ message: "Invalid delivery status" });
    }

    const sale = await Sales.findByPk(id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    sale.deliveryStatus = deliveryStatus;
    await sale.save();

    return res.status(200).json({ message: "Delivery status updated", deliveryStatus: sale.deliveryStatus });
  } catch (error) {
    console.error("Patch Delivery Status Error:", error);
    return res.status(500).json({ message: "Failed to update delivery status" });
  }
};

/**
 * DELETE: Remove a sale
 */
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sales.findByPk(id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    await sale.destroy();
    return res.status(200).json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Delete Sale Error:", error);
    return res.status(500).json({ message: "Failed to delete sale" });
  }
};

// exports.getFilteredSales = async (req, res) => {
//   try {
//     const {
//       orderId,
//       customerId,
//       status,
//       paymentStatus,
//       deliveryStatus,
//     } = req.query;

//     const whereClause = {};

//     if (orderId) whereClause.orderId = Number(orderId);
//     if (customerId) whereClause.customerId = Number(customerId);
//     if (status) whereClause.status = status;
//     if (paymentStatus) whereClause.paymentStatus = paymentStatus;
//     if (deliveryStatus) whereClause.deliveryStatus = deliveryStatus;

//     const sales = await Sales.findAll({
//       where: whereClause,
//       attributes: [
//         // "id",
//         "price",
//         "totalPrice",
//         "paidAmount",
//         "status",
//         "paymentStatus",
//         "deliveryStatus",
//         "createdAt",
//       ],
//       include: [
//         {
//           model: Order,
//           attributes: [
//             "id",
//             "quantity",
//             "offeredPrice",
//             "status",
//           ],
//           include: [
//             {
//               model: Post,
//               attributes: [
//                 "id",
//                 "status",
//                 "detail",
//               ],
//               include: [
//                 {
//                   model: Item,
//                   attributes: [
//                     "id",
//                     "name",
//                   ],
//                 },
//               ],
//             },
//             {
//               model: Customer,
//               attributes: [
//                 "id",
//                 "name",
//                 "phoneNo",
//                 "email",
//               ], // password removed
//               // attributes: { exclude: ["createdAt", "updatedAt", "password"] },
//             },
//           ],
//         },
//         {
//           model: Customer,
//           attributes: [
//             "id",
//             "name",
//             "phoneNo",
//           ],
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//     });

//     return res.status(200).json(sales);

//   } catch (err) {
//     console.error("Get Filtered Sales Error:", err);
//     return res.status(500).json({ message: "Failed to fetch filtered sales" });
//   }
// };



