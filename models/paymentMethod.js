// src/models/payment.model.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const PaymentMethod = sequelize.define("PaymentMethod", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("active", "inactive"),
    defaultValue: "active",
  },
}, {
  timestamps: true,
  charset: "utf8",
  collate: "utf8_general_ci",
});

module.exports = PaymentMethod;
