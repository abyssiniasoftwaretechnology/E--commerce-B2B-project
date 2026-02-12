// models/order.model.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const Customer = require("./customer");
const Post = require("./post");
const PaymentMethod = require("./paymentMethod");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Customer,
        key: "id",
      },
    },

    postId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Post,
        key: "id",
      },
    },

    paymentMethodId: {
      type: DataTypes.INTEGER,
      references: {
        model: PaymentMethod,
        key: "id",
      },
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    offeredPrice: {
      type: DataTypes.DECIMAL(12, 4),
    },

    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
    charset: "utf8",
    collate: "utf8_general_ci",
  },
);

module.exports = Order;
