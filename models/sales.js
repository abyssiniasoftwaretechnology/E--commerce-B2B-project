const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Order = require("./order");
const Customer = require("./customer");

const Sales = sequelize.define(
  "Sales",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Order,
        key: "id",
      },
    },

    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Customer,
        key: "id",
      },
    },

    price: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
    },

    totalPrice: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
    },

    paidAmount: {
      type: DataTypes.DECIMAL(12, 4),
      defaultValue: 0,
    },

    status: {
      type: DataTypes.ENUM("pending", "sold", "cancelled"),
      defaultValue: "pending",
    },

    paymentStatus: {
      type: DataTypes.ENUM("pending", "partial", "paid"),
      defaultValue: "pending",
    },

    deliveryStatus: {
      type: DataTypes.ENUM("pending", "shipped", "delivered"),
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  },
);

module.exports = Sales;
