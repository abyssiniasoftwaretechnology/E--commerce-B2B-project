const { Op, where, col } = require("sequelize");
const {
  sequelize,
  Category,
  SubCategory,
  Item,
  Post,
  Order,
  Customer,
  PaymentMethod,
  Sales,
  SalesRequest,
  User,
} = require("../models");

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [
      categoriesCount,
      subcategoriesCount,
      itemsCount,
      postsCount,
      ordersCount,
      customersCount,
      paymentMethodsCount,
      salesCount,
      salesRequestsCount,
      usersCount,
    ] = await Promise.all([
      Category.count(),
      SubCategory.count(),
      Item.count(),
      Post.count(),
      Order.count(),
      Customer.count(),
      PaymentMethod.count(),
      Sales.count(),
      SalesRequest.count(),
      User.count(),
    ]);

    const lowStockCount = await Item.count({
      where: where(col("quantity"), "<=", col("minQuantity")),
    });

    const featuredCount = await Item.count({
      where: {
        featured: true,
        [Op.or]: [{ featuredUntil: null }, { featuredUntil: { [Op.gt]: now } }],
      },
    });

    // Orders status breakdown
    const [orderPending, orderApproved, orderRejected] = await Promise.all([
      Order.count({ where: { status: "pending" } }),
      Order.count({ where: { status: "approved" } }),
      Order.count({ where: { status: "rejected" } }),
    ]);

    // SalesRequest status breakdown
    const [srPending, srApproved, srRejected] = await Promise.all([
      SalesRequest.count({ where: { status: "pending" } }),
      SalesRequest.count({ where: { status: "approved" } }),
      SalesRequest.count({ where: { status: "rejected" } }),
    ]);

    // Sales status breakdown
    const [salesPending, salesSold, salesCancelled] = await Promise.all([
      Sales.count({ where: { status: "pending" } }),
      Sales.count({ where: { status: "sold" } }),
      Sales.count({ where: { status: "cancelled" } }),
    ]);

    // Recent orders (include customer name and post -> item id & name)
    const recentOrders = await Order.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "quantity", "offeredPrice", "status", "createdAt"],
      include: [
        { model: Customer, attributes: ["id", "name"] },
        {
          model: Post,
          attributes: ["id"],
          include: [{ model: Item, attributes: ["id", "name"] }],
        },
      ],
    });

    const order = {
      total: ordersCount,
      pending: orderPending,
      approved: orderApproved,
      rejected: orderRejected,
    };

    const salesRequest = {
      total: salesRequestsCount,
      pending: srPending,
      approved: srApproved,
      rejected: srRejected,
    };

    const sales = {
      total: salesCount,
      pending: salesPending,
      sold: salesSold,
      cancelled: salesCancelled,
    };

    const totalSales =
      (await Sales.sum("totalPrice", { where: { status: "sold" } })) || 0;
    const totalPaid =
      (await Sales.sum("paidAmount", { where: { status: "sold" } })) || 0;
    const outstanding = parseFloat(totalSales) - parseFloat(totalPaid || 0);

    const recentSales = await Sales.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "totalPrice", "paidAmount", "status", "createdAt"],
      include: [
        {
          model: Order,
          attributes: ["id", "quantity", "offeredPrice", "status", "createdAt"],
          include: [
            {
              model: Post,
              attributes: ["id"],
              include: [{ model: Item, attributes: ["id", "name"] }],
            },
          ],
        },
      ],
    });

    const newCustomersLast7Days = await Customer.count({
      where: { createdAt: { [Op.gte]: sevenDaysAgo } },
    });

    return res.json({
      counts: {
        categories: categoriesCount,
        subcategories: subcategoriesCount,
        items: itemsCount,
        posts: postsCount,
        orders: ordersCount,
        customers: customersCount,
        paymentMethods: paymentMethodsCount,
        sales: salesCount,
        salesRequests: salesRequestsCount,
        users: usersCount,
      },
      lowStockCount,
      featuredCount,
      pendingOrders: order.pending,
      pendingSalesRequests: salesRequest.pending,
      order,
      salesRequest,
      sales,
      recentOrders,
      revenue: {
        totalSales: parseFloat(totalSales || 0),
        totalPaid: parseFloat(totalPaid || 0),
        outstanding: parseFloat(outstanding || 0),
      },
      recentSales,
      newCustomersLast7Days,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    return res
      .status(500)
      .json({ message: "Failed to retrieve dashboard stats" });
  }
};

module.exports = {
  getDashboardStats,
};
