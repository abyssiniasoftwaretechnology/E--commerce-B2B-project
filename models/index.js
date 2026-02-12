const { sequelize } = require("../config/database");

const Category = require("./category");
const SubCategory = require("./subCategory");
const Item = require("./item");
const Post = require("./post");
const Order = require("./order");
const Customer = require("./customer");
const PaymentMethod = require("./paymentMethod");
const Sales = require("./sales");
const SalesRequest = require("./salesRequest");
const User = require("./user");

// Category <> SubCategory
Category.hasMany(SubCategory, { foreignKey: "categoryId" });
SubCategory.belongsTo(Category, { foreignKey: "categoryId" });

// Category <> Item
Category.hasMany(Item, { foreignKey: "categoryId" });
Item.belongsTo(Category, { foreignKey: "categoryId" });

// SubCategory <> Item
SubCategory.hasMany(Item, { foreignKey: "subCategoryId" });
Item.belongsTo(SubCategory, { foreignKey: "subCategoryId" });

// Item <> Post
Item.hasMany(Post, { foreignKey: "itemId" });
Post.belongsTo(Item, { foreignKey: "itemId" });

// Post <> Order
Post.hasMany(Order, { foreignKey: "postId" });
Order.belongsTo(Post, { foreignKey: "postId" });

// Customer <> Order
Customer.hasMany(Order, { foreignKey: "customerId" });
Order.belongsTo(Customer, { foreignKey: "customerId" });

// PaymentMethod <> Order
PaymentMethod.hasMany(Order, { foreignKey: "paymentMethodId" });
Order.belongsTo(PaymentMethod, { foreignKey: "paymentMethodId" });

// PaymentMethod <> SalesRequest
PaymentMethod.hasMany(SalesRequest, { foreignKey: "paymentMethodId" });
SalesRequest.belongsTo(PaymentMethod, { foreignKey: "paymentMethodId" });

// Item <> SalesRequest
Item.hasMany(SalesRequest, { foreignKey: "itemId" });
SalesRequest.belongsTo(Item, { foreignKey: "itemId" });

// Order <> Sales
Order.hasMany(Sales, { foreignKey: "orderId" });
Sales.belongsTo(Order, { foreignKey: "orderId" });

// Customer <> Sales
Customer.hasMany(Sales, { foreignKey: "customerId" });
Sales.belongsTo(Customer, { foreignKey: "customerId" });

module.exports = {
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
};
