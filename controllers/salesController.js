const { Sales, Order, Post, Item, Customer, Category, SubCategory } = require("../models");
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
const { Op } = require("sequelize");

exports.createSale = async (req, res) => {
  try {
    const { orderId, customerId, itemId, price, totalPrice } = req.body;

    if (!price || !totalPrice) {
      return res.status(400).json({
        message: "price and totalPrice are required",
      });
    }

    const sale = await Sales.create({
      orderId: orderId ?? null,
      itemId: itemId ?? null,
      customerId: customerId ?? null,
      price,
      totalPrice,
      paidAmount: req.body.paidAmount ?? 0,
      status: req.body.status ?? "pending",
      paymentStatus: req.body.paymentStatus ?? "pending",
      deliveryStatus: req.body.deliveryStatus ?? "pending",
    });

    return res.status(201).json(sale);
  } catch (error) {
    console.error(error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(404).json({
        message: "Order, Customer or Item not found",
      });
    }

    return res.status(500).json({ message: error.message });
  }
};


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
        {
          model: Item,
          attributes: ["id", "name"],
        }
      ],
      order: [["createdAt", "DESC"]],
    });

    // 🔥 Transform data here
   const formattedSales = sales.map(sale => {
    const saleJSON = sale.toJSON();

    // Convert decimals to numbers
    saleJSON.price = Number(saleJSON.price);
    saleJSON.totalPrice = Number(saleJSON.totalPrice);
    saleJSON.paidAmount = Number(saleJSON.paidAmount);

    if (saleJSON.Order?.offeredPrice) {
      saleJSON.Order.offeredPrice = Number(saleJSON.Order.offeredPrice);
    }

    if (saleJSON.Order?.Post) {

      // Parse images safely
      if (saleJSON.Order.Post.images) {
        saleJSON.Order.Post.images = JSON.parse(saleJSON.Order.Post.images)
          .map(img => img.startsWith("http") ? img : `${BASE_URL}/${img}`);
      }

      // Parse pricing JSON
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

exports.filterSales = async (req, res) => {
  try {
    const {
      orderId,
      customerId,
      status,
      paymentStatus,
      deliveryStatus,
      startDate,
      endDate,
        itemId,
  categoryId,
  subCategoryId
    } = req.query;

    // 🔹 Build dynamic where condition
    const whereCondition = {};

    if (orderId) whereCondition.orderId = orderId;
    if (customerId) whereCondition.customerId = customerId;
    if (status) whereCondition.status = status;
    if (paymentStatus) whereCondition.paymentStatus = paymentStatus;
    if (deliveryStatus) whereCondition.deliveryStatus = deliveryStatus;

    if (startDate || endDate) {
      whereCondition.createdAt = {};
      if (startDate) {
        const [y, m, d] = startDate.split("-").map(Number);
        whereCondition.createdAt[Op.gte] = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
      }
      if (endDate) {
        const [y, m, d] = endDate.split("-").map(Number);
        whereCondition.createdAt[Op.lte] = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
      }
    }

  const sales = await Sales.findAll({
  where: whereCondition,
  attributes: { exclude: ["updatedAt", "orderId"] },
  include: [
    {
      model: Order,
      required: !!itemId || !!categoryId || !!subCategoryId,
      attributes: {
        exclude: ["updatedAt", "customerId", "postId", "paymentMethodId"],
      },
      include: [
        {
          model: Post,
          required: !!itemId || !!categoryId || !!subCategoryId,
          where: itemId ? { itemId: Number(itemId) } : undefined,
          attributes: { exclude: ["updatedAt", "itemId"] },
          include: [
            {
              model: Item,
              required: !!categoryId || !!subCategoryId,
              where:
                categoryId || subCategoryId
                  ? {
                      ...(categoryId && { categoryId: Number(categoryId) }),
                      ...(subCategoryId && {
                        subCategoryId: Number(subCategoryId),
                      }),
                    }
                  : undefined,
              include: [
                {
                  model: Category,
                  attributes: ["id", "name"],
                },
                {
                  model: SubCategory,
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
        {
          model: Customer,
          attributes: {
            exclude: ["updatedAt", "password", "licenseNo", "legalDoc"],
          },
        },
      ],
    },
    {
      model: Customer,
      attributes: {
        exclude: ["updatedAt", "password", "licenseNo", "legalDoc"],
      },
    },
  ],
  order: [["createdAt", "DESC"]],
});


    // 🔥 Transform data (same logic as yours)
   const formattedSales = sales.map((sale) => {
      const saleJSON = sale.toJSON();

      if (saleJSON.Order?.Post) {
        // ✅ Images
        if (saleJSON.Order.Post.images) {
          try {
            const parsedImages =
              typeof saleJSON.Order.Post.images === "string"
                ? JSON.parse(saleJSON.Order.Post.images)
                : saleJSON.Order.Post.images;

            saleJSON.Order.Post.images = parsedImages.map((img) => {
              if (!img) return null;

              // Already full URL
              if (img.startsWith("http://") || img.startsWith("https://")) {
                return img;
              }

              // Add BASE_URL + /uploads safely
              img = img.replace(/^\/+/, ""); // remove leading slashes
              return `${BASE_URL}/uploads/${img}`;
            }).filter(Boolean); // remove null/undefined
          } catch {
            saleJSON.Order.Post.images = [];
          }
        }

        // ✅ Pricing
        if (saleJSON.Order.Post.pricing) {
          try {
            saleJSON.Order.Post.pricing =
              typeof saleJSON.Order.Post.pricing === "string"
                ? JSON.parse(saleJSON.Order.Post.pricing)
                : saleJSON.Order.Post.pricing;
          } catch {
            saleJSON.Order.Post.pricing = [];
          }
        }
      }

      return saleJSON;
    });

    return res.status(200).json(formattedSales);

  } catch (err) {
    console.error("Filter Sales Error:", err);
    return res.status(500).json({ message: "Failed to filter sales" });
  }
};
